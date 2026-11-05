#!/usr/bin/python3
"""Generation gate for agent edits under tests/**.

Cursor matches afterFileEdit against the tool name "Write", not the file path,
so this script applies the tests/** filter itself. Exit 0 allows. Exit 2 blocks
a spec that asserts nothing or that uses a CSS/XPath page.locator.
"""
import json
import os
import re
import sys

LOCATOR_RE = re.compile(
    r"""page\s*\.\s*locator\s*\(\s*(['"`])(.*?)\1""",
    re.DOTALL,
)
SPEC_NAME_RE = re.compile(r"\.(spec|test)\.[cm]?[jt]sx?$")
TEST_CALL_RE = re.compile(r"\b(test|it)\s*\(")


def allow(message):
    sys.stderr.write(message + "\n")
    sys.stdout.write("{}\n")
    sys.exit(0)


def block(message):
    sys.stderr.write(message + "\n")
    sys.stdout.write(message + "\n")
    sys.exit(2)


def under_tests(path):
    norm = path.replace("\\", "/")
    return bool(re.search(r"(^|/)tests/", norm))


def is_spec(path, text):
    name = os.path.basename(path)
    if SPEC_NAME_RE.search(name):
        return True
    return TEST_CALL_RE.search(text) is not None


def css_or_xpath_locators(text):
    found = []
    for match in LOCATOR_RE.finditer(text):
        body = match.group(2)
        if "." in body or "#" in body or "//" in body:
            found.append(body)
    return found


def main():
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        block("BLOCK generation gate: stdin was not JSON")

    file_path = data.get("file_path") or data.get("filePath") or ""
    if not file_path or not under_tests(file_path):
        allow("ALLOW generation gate: outside tests/**")

    if not os.path.isfile(file_path):
        block("BLOCK generation gate: cannot read edited file " + file_path)

    with open(file_path, "r", encoding="utf-8", errors="replace") as handle:
        text = handle.read()

    if not is_spec(file_path, text):
        allow("ALLOW generation gate: " + file_path + " is under tests/ but is not a spec")

    reasons = []
    if "expect(" not in text:
        reasons.append("spec contains no expect( (a test that asserts nothing)")

    locators = css_or_xpath_locators(text)
    if locators:
        shown = ", ".join(repr(body) for body in locators[:5])
        reasons.append(
            "CSS or XPath locator (page.locator with '.', '#', or '//'): " + shown
        )

    if reasons:
        block("BLOCK generation gate for " + file_path + ": " + "; ".join(reasons))

    allow("ALLOW generation gate: " + file_path)


if __name__ == "__main__":
    main()
