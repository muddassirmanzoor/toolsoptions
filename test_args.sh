#!/bin/bash
# Test how arguments are passed
python3 add_page_number.py "test_input.pdf" "test_output.pdf" \
  --position "bottom-left" \
  --start-page 2 \
  --end-page 9 \
  --text-template "{n} / {t}" \
  --text-color "#8B4513" \
  --font-family "Times-Roman" \
  --text-bold false \
  --total-pages 10 2>&1 | head -20
