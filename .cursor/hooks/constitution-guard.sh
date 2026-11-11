#!/usr/bin/env python3
"""Constitution enforcer for tests/** and pages/** after Write edits.

Exit 0 allows. Exit 2 blocks mechanically-checkable WON'T violations introduced
by the edit: waitForTimeout, XPath locators, any typing, hardcoded credentials,
tags on test.describe(), or weakened expect( counts in tests/**.
"""

from __future__ import annotations

import json
import os
import re
import sys

BLOCK_COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
WAIT_RE = re.compile(r"\bwaitForTimeout\s*\(")
ANY_RE = re.compile(
    r"(?::\s*any\b|as\s+any\b|<any>|\bany\s*\[\]|\bArray<\s*any\s*>)"
)
DESCRIBE_TAG_RE = re.compile(
    r"\b(?:test\.)?describe\s*\(\s*['\"`]@[^'\"`]+['\"`]"
)
LOCATOR_RE = re.compile(
    r"""\.locator\(\s*(['"`])((?:\\.|(?!\1).)*)\1""",
    re.DOTALL,
)
CREDENTIAL_RES = (
    re.compile(
        r"(?<!process\.env\.)(?<!env\.)\b(?:password|passwd)\s*[:=]\s*['\"][^'\"]{3,}['\"]",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:api[_-]?key|apikey|client[_-]?secret|auth[_-]?token)\s*[:=]\s*['\"][^'\"]+['\"]",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bDIDAXIS_(?:EMAIL|PASSWORD|URL)\s*=\s*['\"][^'\"]+['\"]",
        re.IGNORECASE,
    ),
)


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


def relative_path(file_path: str, root: str) -> str:
    if root:
        try:
            return os.path.relpath(file_path, root)
        except ValueError:
            return file_path
    return file_path


def scoped_tests_or_pages(file_path: str, root: str) -> bool:
    path = os.path.normpath(file_path)
    base = os.path.normpath(root) if root else ""
    if base and (path == base or path.startswith(base + os.sep)):
        relative = os.path.relpath(path, base)
    else:
        relative = path
    parts = relative.replace("\\", "/").split("/")
    return bool(parts) and parts[0] in ("tests", "pages")


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


def xpath_locator_hits(source: str) -> list[str]:
    hits: list[str] = []
    for match in LOCATOR_RE.finditer(source):
        body = match.group(2)
        if "//" in body or body.strip().lower().startswith("xpath"):
            preview = body if len(body) <= 60 else body[:57] + "..."
            hits.append(f".locator(…{preview}…)")
    if re.search(r"\bxpath\s*=", source, re.IGNORECASE):
        hits.append("xpath= selector")
    return hits


def violation_snippets(source: str, *, check_describe_tag: bool) -> list[str]:
    reasons: list[str] = []
    if WAIT_RE.search(source):
        reasons.append("waitForTimeout")
    for hit in xpath_locator_hits(source):
        reasons.append(f"XPath locator ({hit})")
    if ANY_RE.search(source):
        reasons.append("any type")
    for cred_re in CREDENTIAL_RES:
        if cred_re.search(source):
            reasons.append("hardcoded credential")
            break
    if check_describe_tag and DESCRIBE_TAG_RE.search(source):
        reasons.append("tag on test.describe()")
    return reasons


def introduced_violations(old: str, new: str, *, check_describe_tag: bool) -> list[str]:
    old_set = set(violation_snippets(old, check_describe_tag=check_describe_tag))
    new_set = set(violation_snippets(new, check_describe_tag=check_describe_tag))
    return sorted(new_set - old_set)


def main() -> None:
    raw = sys.stdin.read()
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as exc:
        emit_block(f"constitution guard: hook input is not JSON ({exc})")

    if not isinstance(payload, dict):
        emit_block("constitution guard: hook input is not an object")

    file_path = payload.get("file_path")
    if not isinstance(file_path, str) or not file_path:
        emit_allow()

    root = project_dir(payload)
    if not scoped_tests_or_pages(file_path, root):
        emit_allow()

    rel = relative_path(file_path, root)
    is_test_file = rel.replace("\\", "/").startswith("tests/")
    check_describe = is_test_file

    edits = payload.get("edits")
    if not isinstance(edits, list) or not edits:
        emit_allow()

    blocks: list[str] = []

    if is_test_file:
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
            blocks.append(
                f"weakened assertions (active expect( {old_total} → {new_total})"
            )

    for edit in edits:
        if not isinstance(edit, dict):
            continue
        old = edit.get("old_string")
        new = edit.get("new_string")
        if not isinstance(old, str) or not isinstance(new, str):
            continue
        intro = introduced_violations(old, new, check_describe_tag=check_describe)
        for item in intro:
            if item not in blocks:
                blocks.append(item)

    if blocks:
        emit_block(
            "constitution guard blocked "
            + rel
            + ": "
            + "; ".join(blocks)
            + " (see .cursor/rules/constitution.mdc WON'T)"
        )

    sys.stderr.write(f"constitution guard: allowed {rel}\n")
    emit_allow()


if __name__ == "__main__":
    main()
