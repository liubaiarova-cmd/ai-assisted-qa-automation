#!/usr/bin/env python3
"""Refuse edits that weaken assertions under tests/**.

afterFileEdit matchers are compared to the tool name "Write", so this script
applies the tests/** scope itself. Exit 0 allows. Exit 2 blocks when the edit
reduces active expect( count or comments one out.
"""

from __future__ import annotations

import json
import os
import re
import sys

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def emit_allow() -> None:
    sys.stdout.write("{}\n")
    sys.exit(0)


def emit_block(message: str) -> None:
    sys.stdout.write(message + "\n")
    sys.stderr.write(message + "\n")
    sys.exit(2)


def project_dir(payload: dict) -> str:
    env_dir = (
        os.environ.get("CURSOR_PROJECT_DIR")
        or os.environ.get("CLAUDE_PROJECT_DIR")
        or ""
    )
    if env_dir:
        return env_dir
    roots = payload.get("workspace_roots") or []
    if isinstance(roots, list) and roots and isinstance(roots[0], str):
        return roots[0]
    return ""


def under_tests(file_path: str, root: str) -> bool:
    path = os.path.normpath(file_path)
    base = os.path.normpath(root) if root else ""
    if base and (path == base or path.startswith(base + os.sep)):
        relative = os.path.relpath(path, base)
    else:
        relative = path
    parts = relative.split(os.sep)
    return bool(parts) and parts[0] == "tests"


def strip_comments(source: str) -> str:
    no_block = BLOCK_COMMENT_RE.sub("", source)
    lines: list[str] = []
    for line in no_block.splitlines():
        in_single = False
        in_double = False
        in_template = False
        i = 0
        cut = len(line)
        while i < len(line):
            ch = line[i]
            nxt = line[i + 1] if i + 1 < len(line) else ""
            if ch == "\\" and (in_single or in_double or in_template):
                i += 2
                continue
            if ch == "'" and not in_double and not in_template:
                in_single = not in_single
            elif ch == '"' and not in_single and not in_template:
                in_double = not in_double
            elif ch == "`" and not in_single and not in_double:
                in_template = not in_template
            elif (
                ch == "/"
                and nxt == "/"
                and not in_single
                and not in_double
                and not in_template
            ):
                cut = i
                break
            i += 1
        lines.append(line[:cut])
    return "\n".join(lines)


def active_expect_count(source: str) -> int:
    return strip_comments(source).count("expect(")


def relative_path(file_path: str, root: str) -> str:
    if root:
        try:
            return os.path.relpath(file_path, root)
        except ValueError:
            return file_path
    return file_path


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        emit_block(f"assertion guard: hook input is not JSON ({exc})")

    if not isinstance(payload, dict):
        emit_block("assertion guard: hook input is not an object")

    file_path = payload.get("file_path")
    if not isinstance(file_path, str) or not file_path:
        emit_allow()

    root = project_dir(payload)
    if not under_tests(file_path, root):
        emit_allow()

    edits = payload.get("edits")
    if not isinstance(edits, list) or not edits:
        emit_allow()

    old_total = 0
    new_total = 0
    for edit in edits:
        if not isinstance(edit, dict):
            continue
        old = edit.get("old_string")
        new = edit.get("new_string")
        if not isinstance(old, str) or not isinstance(new, str):
            continue
        old_total += active_expect_count(old)
        new_total += active_expect_count(new)

    if new_total < old_total:
        rel = relative_path(file_path, root)
        emit_block(
            "assertion guard blocked "
            + rel
            + f": edit weakens the test (active expect( {old_total} → {new_total}); "
            + "refuse deleting or commenting out assertions"
        )

    sys.stderr.write(f"assertion guard: allowed {file_path}\n")
    emit_allow()


if __name__ == "__main__":
    main()
