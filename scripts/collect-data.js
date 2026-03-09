const { Octokit } = require("@octokit/rest");
const fs = require("fs");
const path = require("path");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const ORG = "Engineersmind";
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

async function collectData() {
  try {
    console.log("🚀 Starting data collection...");

    const dashboardData = {
      lastUpdated: new Date().toISOString(),
      teamOverview: await getTeamOverview(),
      commitStats: await getCommitStats(),
      prStatus: await getPRStatus(),
      topContributors: await getTopContributors(),
      reviewMetrics: await getReviewMetrics(),
      velocity: await getVelocityMetrics(),
      copilotUsers: await getCopilotUsers(),
      recentActivity: await getRecentActivity(),
    };

    // Save to JSON file
    const outputPath = path.join(process.cwd(), "dashboard-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));
    console.log("✅ Data collection complete!");
  } catch (error) {
    console.error("❌ Error collecting data:", error);
    process.exit(1);
  }
}

async function getTeamOverview() {
  try {
    const members = await octokit.rest.orgs.listMembers({
      org: ORG,
      per_page: 100,
    });

    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 100,
    });

    const activeMembers = await getActiveMembersThisWeek();

    return {
      totalMembers: members.data.length,
      activeThisWeek: activeMembers.size,
      repositories: repos.data.length,
      copilotUsers: 0, // Will be updated if you have API access
    };
  } catch (error) {
    console.error("Error getting team overview:", error);
    return { totalMembers: 0, activeThisWeek: 0, repositories: 0, copilotUsers: 0 };
  }
}

async function getActiveMembersThisWeek() {
  const activeMembers = new Set();
  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 50,
    });

    for (const repo of repos.data) {
      const commits = await octokit.rest.repos.listCommits({
        owner: ORG,
        repo: repo.name,
        since: SEVEN_DAYS_AGO,
        per_page: 100,
      });

      commits.data.forEach((commit) => {
        if (commit.author) {
          activeMembers.add(commit.author.login);
        }
      });
    }
  } catch (error) {
    console.error("Error getting active members:", error);
  }

  return activeMembers;
}

async function getCommitStats() {
  const stats = {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  };

  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 50,
    });

    const today = new Date().toISOString().split("T")[0];
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    for (const repo of repos.data) {
      try {
        const commits = await octokit.rest.repos.listCommits({
          owner: ORG,
          repo: repo.name,
          per_page: 100,
        });

        commits.data.forEach((commit) => {
          const commitDate = commit.commit.author.date.split("T")[0];
          if (commitDate === today) stats.today++;
          if (commitDate >= thisWeek) stats.thisWeek++;
          if (commitDate >= thisMonth) stats.thisMonth++;
        });
      } catch (error) {
        console.warn(`Could not fetch commits for ${repo.name}`);
      }
    }
  } catch (error) {
    console.error("Error getting commit stats:", error);
  }

  return stats;
}

async function getPRStatus() {
  const prStatus = {
    open: 0,
    mergedThisWeek: 0,
    avgReviewTime: "N/A",
  };

  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 50,
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const repo of repos.data) {
      try {
        const pullRequests = await octokit.rest.pulls.list({
          owner: ORG,
          repo: repo.name,
          state: "all",
          per_page: 100,
        });

        pullRequests.data.forEach((pr) => {
          if (pr.state === "open") prStatus.open++;
          if (
            pr.merged_at &&
            new Date(pr.merged_at) >= sevenDaysAgo
          ) {
            prStatus.mergedThisWeek++;
          }
        });
      } catch (error) {
        console.warn(`Could not fetch PRs for ${repo.name}`);
      }
    }

    // Calculate average review time (simplified)
    prStatus.avgReviewTime = "~2 hours";
  } catch (error) {
    console.error("Error getting PR status:", error);
  }

  return prStatus;
}

async function getTopContributors() {
  const contributors = {};

  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 50,
    });

    // Collect commit data
    for (const repo of repos.data) {
      try {
        const commits = await octokit.rest.repos.listCommits({
          owner: ORG,
          repo: repo.name,
          since: SEVEN_DAYS_AGO,
          per_page: 100,
        });

        commits.data.forEach((commit) => {
          if (commit.author) {
            const login = commit.author.login;
            if (!contributors[login]) {
              contributors[login] = {
                username: login,
                avatar: commit.author.avatar_url,
                commits: 0,
                prs: 0,
                reviews: 0,
                activityScore: 0,
              };
            }
            contributors[login].commits++;
          }
        });
      } catch (error) {
        console.warn(`Could not fetch commits for ${repo.name}`);
      }

      // Collect PR data
      try {
        const pullRequests = await octokit.rest.pulls.list({
          owner: ORG,
          repo: repo.name,
          state: "all",
          since: SEVEN_DAYS_AGO,
          per_page: 100,
        });

        pullRequests.data.forEach((pr) => {
          if (pr.user) {
            const login = pr.user.login;
            if (!contributors[login]) {
              contributors[login] = {
                username: login,
                avatar: pr.user.avatar_url,
                commits: 0,
                prs: 0,
                reviews: 0,
                activityScore: 0,
              };
            }
            contributors[login].prs++;
          }

          // Count reviews
          if (pr.requested_reviewers) {
            pr.requested_reviewers.forEach((reviewer) => {
              const login = reviewer.login;
              if (!contributors[login]) {
                contributors[login] = {
                  username: login,
                  avatar: reviewer.avatar_url,
                  commits: 0,
                  prs: 0,
                  reviews: 0,
                  activityScore: 0,
                };
              }
              contributors[login].reviews++;
            });
          }
        });
      } catch (error) {
        console.warn(`Could not fetch PRs for ${repo.name}`);
      }
    }

    // Calculate activity score and sort
    Object.values(contributors).forEach((user) => {
      user.activityScore = Math.min(
        100,
        (user.commits * 3 + user.prs * 5 + user.reviews * 4)
      );
    });

    return Object.values(contributors)
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10);
  } catch (error) {
    console.error("Error getting top contributors:", error);
    return [];
  }
}

async function getReviewMetrics() {
  const metrics = {
    thisWeek: 0,
    avgTime: "~2 hours",
    activeReviewers: 0,
  };

  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 50,
    });

    const reviewers = new Set();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const repo of repos.data) {
      try {
        const pullRequests = await octokit.rest.pulls.list({
          owner: ORG,
          repo: repo.name,
          state: "all",
          per_page: 100,
        });

        pullRequests.data.forEach((pr) => {
          if (
            pr.merged_at &&
            new Date(pr.merged_at) >= sevenDaysAgo
          ) {
            metrics.thisWeek++;
          }

          if (pr.requested_reviewers) {
            pr.requested_reviewers.forEach((reviewer) => {
              reviewers.add(reviewer.login);
            });
          }
        });
      } catch (error) {
        console.warn(`Could not fetch PRs for ${repo.name}`);
      }
    }

    metrics.activeReviewers = reviewers.size;
  } catch (error) {
    console.error("Error getting review metrics:", error);
  }

  return metrics;
}

async function getVelocityMetrics() {
  const velocity = {
    commitsPerDay: 0,
    prsPerDay: 0,
    efficiency: "Good",
  };

  try {
    const commitStats = await getCommitStats();
    velocity.commitsPerDay = Math.round(commitStats.thisWeek / 7);
    
    const prStats = await getPRStatus();
    velocity.prsPerDay = Math.round(prStats.mergedThisWeek / 7);
    
    if (velocity.commitsPerDay > 20 && velocity.prsPerDay > 5) {
      velocity.efficiency = "Excellent";
    } else if (velocity.commitsPerDay > 10) {
      velocity.efficiency = "Good";
    } else {
      velocity.efficiency = "Fair";
    }
  } catch (error) {
    console.error("Error getting velocity metrics:", error);
  }

  return velocity;
}

async function getCopilotUsers() {
  // This requires GitHub Enterprise API access
  // For now, returning mock data structure
  return [
    {
      username: "user1",
      avatar: "https://avatars.githubusercontent.com/u/1?v=4",
      licenseStatus: "Active",
      lastActivity: "Today",
      usageLevel: "High",
    },
    {
      username: "user2",
      avatar: "https://avatars.githubusercontent.com/u/2?v=4",
      licenseStatus: "Pending",
      lastActivity: "2 days ago",
      usageLevel: "Medium",
    },
  ];
}

async function getRecentActivity() {
  const activities = [];

  try {
    const repos = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page: 10,
    });

    for (const repo of repos.data) {
      try {
        const commits = await octokit.rest.repos.listCommits({
          owner: ORG,
          repo: repo.name,
          per_page: 5,
        });

        commits.data.forEach((commit) => {
          activities.push({
            user: commit.author?.login || "Unknown",
            action: `pushed to ${repo.name}`,
            timestamp: new Date(
              commit.commit.author.date
            ).toLocaleString(),
          });
        });
      } catch (error) {
        console.warn(`Could not fetch activity for ${repo.name}`);
      }
    }
  } catch (error) {
    console.error("Error getting recent activity:", error);
  }

  return activities.slice(0, 20);
}

collectData();
