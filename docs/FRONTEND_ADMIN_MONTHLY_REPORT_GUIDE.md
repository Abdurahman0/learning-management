# Frontend Admin Monthly Report PDF Guide

This guide explains how the admin dashboard should wire the **Download PDF**
button in the “Generate Monthly Report” card.

## Endpoint

```http
GET /api/v1/admin/dashboard/monthly-report.pdf
Authorization: Bearer <admin_access_token>
```

The endpoint returns a generated 16:9 landscape PDF report for the current
month by default.

Optional query params:

| Query | Example | Notes |
| --- | --- | --- |
| `year` | `2026` | Integer year |
| `month` | `5` | Month number from `1` to `12` |

Specific period example:

```http
GET /api/v1/admin/dashboard/monthly-report.pdf?year=2026&month=5
Authorization: Bearer <admin_access_token>
```

## Response

Success: `200 OK`

Headers:

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="englishlabs-monthly-report-2026-05.pdf"
```

The response body is binary PDF data.

Errors:

| Status | Meaning |
| --- | --- |
| `400` | Invalid `year` or `month` query params |
| `401` | Missing/expired access token |
| `403` | User is not an admin |

## Frontend Download Flow

Use a blob request. Do not try to parse the response as JSON.

```ts
async function downloadMonthlyReport(token: string, year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));

  const url = `/api/v1/admin/dashboard/monthly-report.pdf${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to download monthly report.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = "englishlabs-monthly-report.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
```

## Report Contents

The PDF includes:

- Monthly KPI summary
- Daily new user trend
- Daily completed test trend
- Daily active student trend
- Band score distribution
- Reading vs listening split
- Feedback moderation summary
- Average reading and listening bands
- Content inventory stats
- Lowest and highest accuracy question types
- Most attempted tests
- Most active students
- Recent feedback preview
