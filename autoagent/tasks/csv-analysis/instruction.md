# CSV Sales Analysis

You have a CSV file at `/task/files/sales.csv` with columns: `date`, `product`, `quantity`, `unit_price`.

Write a Python script that reads this file and produces a JSON report at `/app/output/report.json` with the following structure:

```json
{
  "total_revenue": <float>,
  "top_product": "<product name with highest total revenue>",
  "num_transactions": <int>,
  "revenue_by_product": {
    "<product>": <float>,
    ...
  }
}
```

Revenue for each row is `quantity * unit_price`. Round all floats to 2 decimal places.
