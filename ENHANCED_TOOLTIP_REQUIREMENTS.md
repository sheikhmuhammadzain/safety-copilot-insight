# Enhanced Chart Tooltips - Requirements

## 🎯 Goal

Show detailed breakdown information in chart tooltips when hovering over data points in the Hazards Trend and Incidents Trend charts.

## Current State

**Current Tooltip Shows:**
```
2023-04
■ Count: 22
```

**Desired Tooltip Should Show:**
```
📅 April 2023 - 22 Incidents

Top Departments:
  • Operations (10)
  • Maintenance (8)
  • Engineering (4)

Top Types:
  • Slip (5)
  • Fall (4)
  • Equipment Failure (3)

Severity: Avg 3.2 | Max 5.0
Risk: Avg 3.8 | Max 5.0

Recent Incidents:
  • Worker slipped on wet floor
  • Equipment malfunction in Zone 2
  • Near miss at loading bay
```

---

## 🔧 Backend Requirements

### New Endpoint Needed

**Endpoint:** `GET /analytics/data/incident-trend-detailed`

**Parameters:** Same as `/analytics/data/incident-trend` plus:
- `dataset`: "incident" or "hazard"
- All existing filters (date range, departments, etc.)

**Response Format:**
```json
{
  "labels": ["2023-01", "2023-02", "2023-03"],
  "series": [
    {
      "name": "Total",
      "data": [15, 22, 18]
    }
  ],
  "details": [
    {
      "month": "2023-01",
      "total_count": 15,
      "departments": [
        { "name": "Operations", "count": 8 },
        { "name": "Maintenance", "count": 5 },
        { "name": "Engineering", "count": 2 }
      ],
      "types": [
        { "name": "Slip", "count": 4 },
        { "name": "Fall", "count": 3 },
        { "name": "Equipment Failure", "count": 3 }
      ],
      "severity": {
        "avg": 3.2,
        "max": 5.0,
        "min": 1.0
      },
      "risk": {
        "avg": 3.8,
        "max": 5.0,
        "min": 2.0
      },
      "recent_items": [
        {
          "title": "Worker slipped on wet floor",
          "department": "Operations",
          "date": "2023-01-15",
          "severity": 3.0
        },
        {
          "title": "Equipment malfunction in Zone 2",
          "department": "Maintenance",
          "date": "2023-01-20",
          "severity": 4.0
        }
      ]
    },
    // ... more months
  ]
}
```

---

## 🎨 Frontend Implementation

### 1. Enhanced Tooltip Component

Create `src/components/charts/EnhancedLineTooltip.tsx`:

```tsx
interface TooltipData {
  month: string;
  total_count: number;
  departments: Array<{ name: string; count: number }>;
  types: Array<{ name: string; count: number }>;
  severity: { avg: number; max: number; min: number };
  risk: { avg: number; max: number; min: number };
  recent_items: Array<{
    title: string;
    department: string;
    date: string;
    severity: number;
  }>;
}

export function EnhancedLineTooltip({ active, payload, details }: any) {
  if (!active || !payload || !payload.length) return null;
  
  const monthLabel = payload[0].payload.label;
  const monthDetails = details?.find((d: TooltipData) => d.month === monthLabel);
  
  if (!monthDetails) return <DefaultTooltip />;
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="font-semibold text-slate-900 mb-3">
        📅 {formatMonth(monthLabel)} - {monthDetails.total_count} Incidents
      </div>
      
      {/* Top Departments */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-600 mb-1">Top Departments:</p>
        {monthDetails.departments.slice(0, 3).map((dept) => (
          <p key={dept.name} className="text-xs text-slate-700">
            • {dept.name} ({dept.count})
          </p>
        ))}
      </div>
      
      {/* Top Types */}
      <div className="mb-3">
        <p className="text-xs font-medium text-slate-600 mb-1">Top Types:</p>
        {monthDetails.types.slice(0, 3).map((type) => (
          <p key={type.name} className="text-xs text-slate-700">
            • {type.name} ({type.count})
          </p>
        ))}
      </div>
      
      {/* Stats */}
      <div className="mb-3 text-xs text-slate-600">
        <p>Severity: Avg {monthDetails.severity.avg.toFixed(1)} | Max {monthDetails.severity.max}</p>
        <p>Risk: Avg {monthDetails.risk.avg.toFixed(1)} | Max {monthDetails.risk.max}</p>
      </div>
      
      {/* Recent Items */}
      {monthDetails.recent_items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-1">Recent Incidents:</p>
          {monthDetails.recent_items.slice(0, 3).map((item, idx) => (
            <p key={idx} className="text-xs text-slate-700 truncate">
              • {item.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. Update Chart Response Type

```typescript
type ChartResponseDetailed = {
  labels: string[];
  series: Series[];
  details?: TooltipData[];
};
```

### 3. Update ShadcnLineCard

Pass details to custom tooltip component.

---

## 🚀 Alternative: Client-Side Solution (No Backend Changes)

If you can't modify the backend immediately, we can:

1. **Fetch raw data separately** and aggregate on frontend
2. **Use existing data endpoints** to get details
3. **Cache the detailed data** for tooltip display

### Client-Side Approach

```tsx
// Fetch detailed data for tooltip
const { data: detailedData } = useCachedGet('/incidents', {
  ...filterParams,
  group_by: 'month'
});

// Process into tooltip format
const tooltipDetails = processDetailsForTooltip(detailedData);

// Pass to chart
<ShadcnLineCard 
  tooltipDetails={tooltipDetails}
  ...
/>
```

---

## 📊 Recommended Approach

### Option 1: Backend Endpoint (Recommended)
✅ **Pros:** Clean, efficient, scalable
❌ **Cons:** Requires backend changes

### Option 2: Client-Side Aggregation
✅ **Pros:** No backend changes needed
❌ **Cons:** More API calls, slower, complex logic

---

## 🎯 Next Steps

**Choose one:**

1. **Backend Approach** - I'll provide the Python code for the new endpoint
2. **Client-Side Approach** - I'll implement tooltip details using existing endpoints

Which approach would you prefer?
