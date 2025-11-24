# Relay42 Audience Builder - UX Prototype

## Overview
A React-based UX prototype for building marketing audiences. Users can view saved audiences and create new ones using a visual query builder that filters customer profiles based on facts and engagements.

## Tech Stack
- React 18 + TypeScript + Vite
- Chakra UI v3
- React Router v6
- date-fns

## Data Architecture

### Schema-First Approach
- **3 Industries**: E-commerce, Airlines, Insurance (swappable datasets)
- **500 customers per industry** with realistic distributions
- **Time-series engagements**: Multiple events per customer
- **Static properties**: For prototype simplicity

### File Structure (per industry)
```
/src/data/industries/
  /ecommerce/
    schema.json      # Fact/engagement definitions
    customers.json   # 500 customers with realistic data
    audiences.json   # Saved audiences
  /airlines/
    schema.json
    customers.json
    audiences.json
  /insurance/
    schema.json
    customers.json
    audiences.json
```

## Application Pages

### 1. List Page (`/`)
- Displays all saved audiences in a table/grid
- Shows: Name, Created Date, Modified Date, Audience Size
- Actions: Create New, View/Edit, Delete
- Industry selector dropdown

### 2. Focus Page (`/audience/:id` or `/audience/new`)
- **View mode** (default): Read-only display of audience details
- **Edit button**: Enables editing mode
- **Edit mode**: Query builder + Save/Cancel
- Used for both viewing existing and creating new audiences

## Key Features

### Visual Query Builder
- AND/OR operators with nested groups
- Comparison operators: equals, notEquals, greaterThan, lessThan, contains, etc.
- Time windows for engagements: last7days, last30days, last90days, lastYear
- Type-aware value inputs
- Live customer count preview

### Query Engine
- Recursive condition group evaluation
- Fact matching (direct property comparison)
- Engagement matching with time windows
- Aggregation support (count, sum, avg)
- Type-aware comparisons

### Realistic Mock Data Distributions

#### E-commerce (500 customers)
- Membership tiers: 60% bronze, 25% silver, 12% gold, 3% platinum
- Age: Bell curve 25-65, peak at 35-45
- Lifetime value: Long tail distribution
- Engagements: Varying frequency per customer

#### Airlines (500 customers)
- FF Status: 70% basic, 20% silver, 8% gold, 2% platinum
- Miles balance: Power law distribution
- Flight frequency: 40% occasional, 40% regular, 20% frequent

#### Insurance (500 customers)
- Policy types: 50% auto, 30% home, 15% life, 5% multiple
- Risk scores: Normal distribution 300-850
- Claim frequency: 80% 0-1 claims, 15% 2-3, 5% 4+

---

## Implementation Progress

### Phase 1: Project Setup ✅
- [x] Create PROJECT.md
- [x] Initialize Vite + React + TypeScript
- [x] Install dependencies (Chakra UI v3, React Router, date-fns)
- [x] Create folder structure
- [x] Set up basic routing scaffold

### Phase 2: TypeScript Types ✅
- [x] Define schema types (FactDefinition, EngagementDefinition)
- [x] Define customer types (Customer, Fact, Engagement)
- [x] Define audience types (Audience, Condition, ConditionGroup)
- [x] Define query types (Operator, TimeWindow, etc.)

### Phase 3: Schema Generation ✅
- [x] E-commerce schema.json (9 facts, 7 engagements)
- [x] Airlines schema.json (9 facts, 7 engagements)
- [x] Insurance schema.json (10 facts, 7 engagements)

### Phase 4: Customer Data Generation ✅
- [x] Generate 500 e-commerce customers with realistic distributions
- [x] Generate 500 airlines customers with realistic distributions
- [x] Generate 500 insurance customers with realistic distributions
- [x] Create empty audiences.json for each industry

### Phase 5: Query Engine ✅
- [x] Recursive condition group evaluator
- [x] Fact matching logic
- [x] Engagement matching with time windows
- [x] Aggregation support (count, sum, avg, min, max)
- [x] Type-aware comparisons
- [x] Date/time range filtering
- [x] All comparison operators (equals, contains, greaterThan, etc.)

### Phase 6: Data Utilities & Hooks ✅
- [x] dataLoader.ts utility
- [x] queryEngine.ts utility
- [x] useAudiences hook (CRUD operations)
- [x] AppContext for global state
- [x] Integrated with React app

### Phase 7: UI Development (Future - Iterative)
- [ ] Industry selector component
- [ ] Audience list table
- [ ] Focus page layout (view/edit modes)
- [ ] Query builder components
- [ ] Save/edit functionality

---

## Foundation Complete! 🎉

All Phase 1-6 tasks are complete. The application now has:
- **1,500 realistic customer records** (500 per industry)
- **3 complete industry schemas** with comprehensive fact and engagement definitions
- **Working query engine** that can evaluate complex nested conditions
- **Type-safe React application** with routing and global state management
- **Zero TypeScript errors** - production-ready build

The foundation is solid and ready for iterative UI development.

---

## Development Notes

### Current Status
Setting up project foundation - data and logic first, UI second.

### Next Steps
1. Initialize Vite project
2. Set up dependencies and folder structure
3. Define TypeScript interfaces
4. Generate schemas and mock data
5. Build query engine
6. Then move to UI development piece by piece

### Success Criteria for Foundation
- Query engine correctly filters 500 customers in <100ms
- All 3 industries have complete, valid data
- TypeScript has zero errors
- Data structure supports all planned query operations
- Ready to plug in UI components
