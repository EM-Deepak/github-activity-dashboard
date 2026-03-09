# 🚀 Engineersmind Activity Dashboard

Real-time GitHub activity monitoring dashboard for the Engineersmind organization.

## Features

- **Real-time Updates**: Data refreshed every 5 minutes via GitHub Actions
- **Team Overview**: Total members, active developers, repositories, Copilot users
- **Commit Tracking**: Daily, weekly, and monthly commit statistics
- **PR Metrics**: Open PRs, merged PRs, review times
- **Code Review Analytics**: Review activity and metrics
- **Team Velocity**: Commits per day, PRs per day, team efficiency
- **Copilot Usage**: License status and usage tracking
- **Activity Feed**: Recent commits and PR activity

## Dashboard Metrics

### Team Overview
- Total organization members
- Active members this week
- Total repositories
- Copilot license holders

### Commits Per User
- Real-time commit counts
- 7-day activity tracking
- Individual contributor metrics

### PR Activity
- Open pull requests
- Merged PRs this week
- Average review time
- Code review metrics

### Team Velocity
- Commits per day (average)
- PRs per day (average)
- Team efficiency rating
- Historical trends

### Copilot Usage
- Active license holders
- License status
- Last activity timestamp
- Usage levels

## Setup Instructions

### 1. Create Repository

Create a new public repository in the Engineersmind organization:
```
Repository name: github-activity-dashboard
Visibility: Public (required for GitHub Pages)
```

### 2. Add Files

Copy all the files from this setup to your repository:
- `index.html` - Dashboard UI
- `.github/workflows/collect-data.yml` - GitHub Actions workflow
- `scripts/collect-data.js` - Data collection script
- `package.json` - Node dependencies
- `_config.yml` - GitHub Pages config

### 3. Enable GitHub Pages

1. Go to repository Settings
2. Scroll to "GitHub Pages"
3. Select "Deploy from a branch"
4. Select `main` branch and `/root` directory
5. Save

### 4. Update GitHub Actions Permissions

1. Go to Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"

### 5. Install Dependencies

GitHub Actions will automatically install dependencies, but you can test locally:
```bash
npm install
```

### 6. Run Data Collection Locally (Optional)

```bash
GITHUB_TOKEN=your_token npm run collect-data
```

## How It Works

1. **GitHub Actions Workflow**: Runs every 5 minutes
2. **Data Collection**: Script collects:
   - Commits from all repositories
   - Pull request data
   - User activity
   - Review metrics
3. **Data Storage**: Results saved to `dashboard-data.json`
4. **Dashboard Update**: Browser polls `dashboard-data.json` every 30 seconds
5. **Real-time Display**: Dashboard updates automatically

## Data Sources

The dashboard collects data from:
- GitHub REST API
- Repository commits
- Pull request history
- Issue tracking
- User activity

## Customization

### Update Frequency
Edit `.github/workflows/collect-data.yml`:
```yaml
- cron: '*/5 * * * *'  # Every 5 minutes
```

### Dashboard Polling
Edit `index.html`:
```javascript
updateInterval: 30000 // 30 seconds
```

### Metrics to Track
Edit `scripts/collect-data.js` to add custom metrics

### Styling
Modify CSS in `index.html` to match your branding

## Access Your Dashboard

After setup, your dashboard will be available at:
```
https://engineersmind.github.io/github-activity-dashboard/
```

## Troubleshooting

### Data Not Updating
1. Check GitHub Actions → Workflows
2. Verify GITHUB_TOKEN has correct permissions
3. Check `dashboard-data.json` exists
4. Browser cache - use Ctrl+F5 to refresh

### GitHub Actions Failing
1. Check workflow logs in Actions tab
2. Verify permissions set to "Read and write"
3. Check API rate limits
4. Ensure `package.json` dependencies are correct

### Dashboard Not Loading
1. Verify GitHub Pages is enabled
2. Check `index.html` is in repository root
3. Clear browser cache
4. Check network errors in browser console

## Features Coming Soon

- [ ] Historical data tracking
- [ ] Custom date ranges
- [ ] Export to CSV
- [ ] Slack integration
- [ ] Email reports
- [ ] Advanced filtering
- [ ] Team performance predictions

## Support

For issues or questions, create an issue in this repository.

---

**Last Updated**: 2026-03-09
**Update Frequency**: Every 5 minutes
**Status**: Active ✅
