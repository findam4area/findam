# Admin Analytics Dashboard

## Overview

This page provides comprehensive analytics for administrators to monitor platform performance, category usage, and business metrics.

## Task Implementation

**Task 23.5: Create admin pages**
- Requirements: 19.1, 20.4, 20.5

## Features

### Business Analytics
- **Total Businesses**: Display count of all registered businesses
- **Verified Businesses**: Track verification rate and count
- **Premium Businesses**: Monitor premium subscription adoption
- **Average Completeness**: Track business profile completion metrics
- **Category Distribution**: Visual chart showing businesses by category (top 10)
- **Geographic Distribution**: Visual chart showing businesses by state (top 10)

### Category Analytics
- **Top Categories by Business Count**: Top 10 categories with most businesses
- **Top Categories by Search Count**: Top 10 most searched categories
- **Trending Categories**: Categories with highest growth percentage
- **Empty Categories**: Categories with no businesses assigned

## API Endpoints Used

- `GET /api/admin/analytics/businesses` - Fetch business analytics data
- `GET /api/admin/analytics/categories` - Fetch category analytics data

## Components Used

- `BusinessAnalyticsDashboard` - Displays business metrics and charts
- `CategoryAnalyticsDashboard` - Displays category usage and trends
- Tabs component for switching between analytics views
- Card components for organized layout

## Access Control

This page requires admin authentication. Users must:
1. Be authenticated with a valid session
2. Have admin role/permissions
3. Access is controlled at the page level with authentication checks

## Navigation

- Accessible from: `/admin/analytics`
- Related pages:
  - `/admin/categories` - Category management
  - `/admin/categories/import` - CSV import
  - `/admin/dashboard` - Main admin dashboard

## Requirements Coverage

### Requirement 20.4: Category Analytics - Top Categories by Business Count
✓ Displays top 10 categories by business count with visual bar charts

### Requirement 20.5: Category Analytics - Top Categories by Search Count  
✓ Displays top 10 most searched categories with visual bar charts

### Requirement 20.6: Category Analytics - Empty Categories
✓ Lists all categories with zero businesses assigned

### Requirement 20.1: Business Analytics Overview
✓ Displays total, verified, premium business counts
✓ Shows average completeness percentage
✓ Includes distribution charts by category and state
