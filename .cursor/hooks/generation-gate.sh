#!/usr/bin/env python3
"""Generation gate for specs under tests/**.

afterFileEdit matchers are compared to the tool name "Write", so this script
applies the tests/** scope itself: only *.spec.* / *.test.* files under tests/
are judged. Exit 0 allows. Exit 2 blocks a spec with no expect( or with a
page.locator whose selector contains '.', '#', or '//'.
"""

import json
import os
import re
import sys

LOCATOR_RE = re.compile(
    r"""page\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1""",
    re.DOTALL,
)
SPEC_RE = re.compile(r"\.(spec|test)\.[cm]?[jt]sx?$")


def emit_allow() -> None:
    sys.stdout.write("{}\n")
    sys.exit(0)


def emit_block(message: str) -> None:
    sys.stdout.write(message + "\n")
    sys.stderr.write(message + "\n")
    sys.exit(2)


def under_tests(file_path: str, project_dir: str) -> bool:
    path = os.path.normpath(file_path)
    root = os.path.normpath(project_dir) if project_dir else ""
    if root and (path == root or path.startswith(root + os.sep)):
        relative = os.path.relpath(path, root)
    else:
        relative = path
    parts = relative.split(os.sep)
    return len(parts) >= 2 and parts[0] == "tests"


def project_dir(payload: dict) -> str:
    env_dir = os.environ.get("CURSOR_PROJECT_DIR") or os.environ.get("CLAUDE_PROJECT_DIR") or ""
    if env_dir:
        return env_dir
    roots = payload.get("workspace_roots") or []
    if isinstance(roots, list) and roots and isinstance(roots[0], str):
        return roots[0]
    return ""


def locator_violations(source: str) -> list[str]:
    found: list[str] = []
    for match in LOCATOR_RE.finditer(source):
        quote, body = match.group(1), match.group(2)
        if "." in body or "#" in body or "//" in body:
            preview = body if len(body) <= 80 else body[:77] + "..."
            found.append(f"page.locator({quote}{preview}{quote})")
    return found


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        emit_block(f"generation gate: hook input is not JSON ({exc})")

    if not isinstance(payload, dict):
        emit_block("generation gate: hook input is not an object")

    file_path = payload.get("file_path")
    if not isinstance(file_path, str) or not file_path:
        emit_allow()

    if not under_tests(file_path, project_dir(payload)):
        emit_allow()

    if SPEC_RE.search(os.path.basename(file_path)) is None:
        emit_allow()

    try:
        with open(file_path, encoding="utf-8") as handle:
            source = handle.read()
    except OSError as exc:
        emit_block(f"generation gate: could not read {file_path} ({exc})")

    reasons: list[str] = []
    if "expect(" not in source:
        reasons.append("spec contains no expect( (a test that asserts nothing)")

    locators = locator_violations(source)
    if locators:
        reasons.append(
            "CSS or XPath locator: " + ", ".join(locators)
        )

    if reasons:
        relative = file_path
        root = project_dir(payload)
        if root:
            relative = os.path.relpath(file_path, root)
        emit_block("generation gate blocked " + relative + ": " + "; ".join(reasons))

    sys.stderr.write(f"generation gate: allowed {file_path}\n")
    emit_allow()


if __name__ == "__main__":
    main()