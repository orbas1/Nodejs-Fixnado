## Application Bootstrap Guards

- Added a PII configuration assertion during Express bootstrap to halt startup when encryption or hash keys are missing, reducing the risk of silently persisting plaintext data.
