include .make/base.mk

.PHONY: validate
validate:
	python3 scripts/validate-catalog.py
