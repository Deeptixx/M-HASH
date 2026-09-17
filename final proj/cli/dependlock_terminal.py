from __future__ import annotations
#!/usr/bin/env python3
"""
DependLock Terminal Monitor
───────────────────────────
Live CLI dashboard showing frontend ↔ backend communication,
ecosystem stats, and system status in real time.

Usage:
    python cli/dependlock_terminal.py [--host HOST] [--port PORT]

Requirements:
    pip install rich requests
"""
import time
import sys
import argparse
import subprocess
import threading
import requests
from datetime import datetime
from rich.console import Console
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.live import Live
from rich.columns import Columns
from rich.align import Align
from rich import box

console = Console()

# ── ASCII banner ────────────────────────────────────────────────────────────────
BANNER = r"""
  ██████╗ ███████╗██████╗ ███████╗███╗   ██╗██████╗ ██╗      ██████╗  ██████╗██╗  ██╗
  ██╔══██╗██╔════╝██╔══██╗██╔════╝████╗  ██║██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝
  ██║  ██║█████╗  ██████╔╝█████╗  ██╔██╗ ██║██║  ██║██║     ██║   ██║██║     █████╔╝ 
  ██║  ██║██╔══╝  ██╔═══╝ ██╔══╝  ██║╚██╗██║██║  ██║██║     ██║   ██║██║     ██╔═██╗ 
  ██████╔╝███████╗██║     ███████╗██║ ╚████║██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗
  ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝
"""

BANNER_MINI = r"""
  ██████╗ ██╗     
  ██╔══██╗██║     
  ██║  ██║██║     
  ██║  ██║██║     
  ██████╔╝███████╗
  ╚═════╝ ╚══════╝  DependLock
"""

# ── API helpers ─────────────────────────────────────────────────────────────────
def fetch_summary(base_url: str) -> object:
    try:
        r = requests.get(f"{base_url}/api/dashboard/summary", timeout=2)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None

def fetch_packages_count(base_url: str) -> object:
    try:
        r = requests.get(f"{base_url}/api/risk/packages", timeout=2)
        r.raise_for_status()
        return len(r.json())
    except Exception:
        return None

def fetch_ecosystem(base_url: str) -> object:
    try:
        r = requests.get(f"{base_url}/api/ecosystem", timeout=2)
        r.raise_for_status()
        d = r.json()
        nodes = d.get("nodes", [])
        edges = d.get("edges", [])
        return {
            "nodes": len(nodes),
            "edges": len(edges),
            "apps": sum(1 for n in nodes if n.get("type") == "application"),
            "services": sum(1 for n in nodes if n.get("type") == "service"),
            "packages": sum(1 for n in nodes if n.get("type") == "package"),
        }
    except Exception:
        return None

# ── Traffic log ─────────────────────────────────────────────────────────────────
traffic_log: list[tuple[str, str, str]] = []
log_lock = threading.Lock()

ENDPOINTS_TO_POLL = [
    ("/api/dashboard/summary", "GET", "Dashboard summary KPIs"),
    ("/api/ecosystem", "GET", "Graph nodes + edges"),
    ("/api/risk/hotspots", "GET", "Top-N risk hotspots"),
    ("/api/risk/packages", "GET", "All package risk scores"),
]

def log_request(method: str, endpoint: str, status: str, latency_ms: float):
    ts = datetime.now().strftime("%H:%M:%S")
    with log_lock:
        traffic_log.append((ts, f"{method} {endpoint}", f"{status} [{latency_ms:.0f}ms]"))
        if len(traffic_log) > 20:
            traffic_log.pop(0)

def poll_backend(base_url: str, stop_event: threading.Event):
    """Background thread: polls all endpoints and records latency."""
    idx = 0
    while not stop_event.is_set():
        endpoint, method, _ = ENDPOINTS_TO_POLL[idx % len(ENDPOINTS_TO_POLL)]
        t0 = time.time()
        try:
            r = requests.get(f"{base_url}{endpoint}", timeout=3)
            latency = (time.time() - t0) * 1000
            log_request(method, endpoint, str(r.status_code), latency)
        except requests.ConnectionError:
            log_request(method, endpoint, "ERR", 0)
        except Exception:
            log_request(method, endpoint, "???", 0)
        idx += 1
        stop_event.wait(3)

# ── Render helpers ───────────────────────────────────────────────────────────────
def risk_bar(score: float, width: int = 20) -> str:
    filled = int((score / 100) * width)
    color = "red" if score >= 70 else "yellow" if score >= 40 else "green"
    bar = "█" * filled + "░" * (width - filled)
    return f"[{color}]{bar}[/{color}] [bold]{score:.1f}[/bold]"

def make_banner_panel() -> Panel:
    text = Text(BANNER, style="bold cyan", justify="center")
    sub = Text("\n  Dependency Exit Intelligence Platform  •  Exit Risk • Blast Radius • Mitigation\n", style="dim cyan", justify="center")
    content = Align.center(text + sub)
    return Panel(content, border_style="cyan", padding=(0, 2))

def make_status_panel(base_url: str, summary: object, eco: object) -> Panel:
    if summary is None:
        content = Text("  ⚠  Backend offline — start with: python backend/run.py", style="bold red")
        return Panel(content, title="[red]● Backend Status[/red]", border_style="red")

    tbl = Table(box=None, show_header=False, padding=(0, 2))
    tbl.add_column("Key", style="dim")
    tbl.add_column("Value", style="bold")
    tbl.add_row("● Status", "[green]Online[/green]")
    tbl.add_row("  API Base", f"[cyan]{base_url}[/cyan]")
    tbl.add_row("  Ecosystem Risk", risk_bar(summary.get("ecosystem_risk", 0)))
    tbl.add_row("  Needs Action", f"[red]{summary.get('critical_dependencies', '?')}[/red] packages")
    tbl.add_row("  Applications", f"[blue]{summary.get('total_applications', '?')}[/blue]")
    tbl.add_row("  Critical Apps", f"[yellow]{summary.get('critical_applications', '?')}[/yellow]")
    tbl.add_row("  Max Blast", f"[red]{summary.get('highest_blast_radius', '?')}[/red] apps")
    if eco:
        tbl.add_row("", "")
        tbl.add_row("  Graph Nodes", f"[white]{eco['nodes']}[/white]  ({eco['apps']} apps · {eco['services']} svcs · {eco['packages']} pkgs)")
        tbl.add_row("  Graph Edges", f"[white]{eco['edges']}[/white]")

    return Panel(tbl, title="[green]● Backend Status[/green]", border_style="green")

def make_traffic_panel() -> Panel:
    tbl = Table(box=box.SIMPLE, show_header=True, header_style="bold dim", padding=(0, 1))
    tbl.add_column("Time", style="dim", width=10)
    tbl.add_column("Endpoint", style="cyan", min_width=35)
    tbl.add_column("Result", style="white", width=16)

    with log_lock:
        rows = list(traffic_log[-14:])

    for ts, endpoint, result in rows:
        status_str = result.split("[")[0].strip()
        if status_str == "200":
            result_text = f"[green]{result}[/green]"
        elif status_str.startswith("4") or status_str.startswith("5"):
            result_text = f"[red]{result}[/red]"
        elif status_str == "ERR":
            result_text = f"[bold red]{result}[/bold red]"
        else:
            result_text = f"[yellow]{result}[/yellow]"
        tbl.add_row(ts, endpoint, result_text)

    if not rows:
        tbl.add_row("--:--:--", "Waiting for requests...", "[dim]–[/dim]")

    return Panel(tbl, title="[cyan]⇄ Frontend ↔ Backend Traffic[/cyan]", border_style="dim cyan")

def make_commands_panel() -> Panel:
    text = Text()
    text.append("  Commands  \n", style="bold")
    text.append("  [R] ", style="bold yellow"); text.append("Reset to sample data\n", style="dim")
    text.append("  [U] ", style="bold cyan");  text.append("Upload ecosystem JSON\n", style="dim")
    text.append("  [O] ", style="bold green"); text.append("Open browser (localhost:5173)\n", style="dim")
    text.append("  [Q] ", style="bold red");   text.append("Quit monitor\n", style="dim")
    text.append("\n  Frontend: ", style="dim"); text.append("http://localhost:5173\n", style="cyan")
    text.append("  Backend:  ", style="dim"); text.append("http://localhost:8000\n", style="cyan")
    text.append("  API Docs: ", style="dim"); text.append("http://localhost:8000/docs\n", style="cyan")
    return Panel(text, title="[dim]Commands[/dim]", border_style="dim")

def make_layout(base_url: str, summary: object, eco: object) -> Layout:
    layout = Layout()
    layout.split_column(
        Layout(name="banner", size=10),
        Layout(name="main"),
        Layout(name="traffic", size=18),
        Layout(name="footer", size=1),
    )
    layout["main"].split_row(
        Layout(name="status"),
        Layout(name="commands", size=40),
    )
    layout["banner"].update(make_banner_panel())
    layout["status"].update(make_status_panel(base_url, summary, eco))
    layout["commands"].update(make_commands_panel())
    layout["traffic"].update(make_traffic_panel())
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    layout["footer"].update(Align.center(
        Text(f"  DependLock Terminal Monitor  •  {now}  •  Press Q to quit  ", style="dim")
    ))
    return layout

# ── Main ─────────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="DependLock Terminal Monitor")
    parser.add_argument("--host", default="localhost", help="Backend host (default: localhost)")
    parser.add_argument("--port", default=8000, type=int, help="Backend port (default: 8000)")
    args = parser.parse_args()
    base_url = f"http://{args.host}:{args.port}"

    stop_event = threading.Event()
    poll_thread = threading.Thread(target=poll_backend, args=(base_url, stop_event), daemon=True)
    poll_thread.start()

    console.clear()

    try:
        with Live(console=console, refresh_per_second=2, screen=True) as live:
            while True:
                summary = fetch_summary(base_url)
                eco = fetch_ecosystem(base_url)
                live.update(make_layout(base_url, summary, eco))
                time.sleep(0.5)
    except KeyboardInterrupt:
        stop_event.set()
        console.clear()
        console.print("\n[bold cyan]DependLock Terminal Monitor stopped.[/bold cyan]\n")
        sys.exit(0)

if __name__ == "__main__":
    main()
