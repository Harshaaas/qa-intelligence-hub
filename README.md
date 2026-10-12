# QA Intelligence Hub

Four tabs: the **Statistical Engine**, the **Template Repository**, the **Environment Directory** and **Admin Settings** (Team Leads and Project Managers only).

**Logo:** save the official ESDS logo as `public/brand/esds-logo.png`. Until then the header shows a text badge.

## Design

The UI follows the Figma design "QA Intelligence Hub Design": dark sidebar navigation, blue template-update banner, Inter font and the design's colour palette.
All colours are defined once at the top of `src/styles.css`. The Executive Dashboard from the design is not included yet.

## Statistical Engine

Upload a Jira bug export (.csv, .xlsx or Jira .xls) and get, automatically:

- **Pareto Analysis (80/20 Rule)**: which defect categories cause most of the defects
- **Statistical Process Control (SPC)**: c-chart of defects per sprint with control limits
- **Hypothesis Testing**
  - **ANOVA**: do defect rates differ significantly across teams?
  - **Independent T-Test**: does a metric (story points or resolution time) differ between two sprints?

- **Filters:** Month, Year and Project filter the uploaded data.
- **KPI cards:**
  - **Process Capability (Cpu)** = (target − mean defects per sprint) ÷ (3 × standard deviation). 1.33 or more is Capable, 1.0–1.33 Marginal, below 1.0 Not capable.
  - **Sigma Level** = 3 × Cpu (short-term).
  - **Defect Rate** = defects ÷ (test cases per sprint × sprints). It shows "Controlled" when the SPC chart has no out-of-control sprints.
  - The targets (max defects per sprint, default 40; test cases per sprint, default 300) are set with **Targets** in the Viewing bar by a TL or PM. Set them to your project's real numbers before showing results.

Everything runs in the browser. No server or database, and uploaded files never leave the user's computer.

## Template Repository

CMMI-compliant document templates that the whole team downloads from one place:

| Template | Format |
|---|---|
| Test Plan Template | Word (.docx) |
| Requirements Traceability Matrix | Excel (.xlsx) |
| Test Case Template | Excel (.xlsx) |
| Defect Report Template | Excel (.xlsx) |
| Test Summary Report | Word (.docx) |

- Every card shows the current **version** and when it was **updated** (e.g. "v1.5, 1 week ago").
- **Team Leads and Project Managers** see "Upload template" and "Upload new version". The app suggests the next version number, checks the file type, and asks what changed.
- **Everyone else** can only download. Earlier versions stay available under "Show version history".
- **Notifications:** when a new version is uploaded, team members see a red count on the bell, an "Updated" highlight on the card, a banner listing the changes, and a pop-up if the app is open at the time.

Who can upload is set in `src/utils/roles.js` (one line). The starter templates live in `public/templates/`.

### Demo mode

There's no server yet, so uploaded files are stored in the browser (IndexedDB) and the "Viewing as" menu simulates different users.
To demo notifications, open the app in **two browser windows**: switch one to a QA Engineer, then upload from the other as Priya (Team Lead). The notification appears instantly.

To share templates across the real team, only `src/lib/templateStore.js` needs to change (to SharePoint, Firebase Storage or a company API), plus real login in `src/context/UserContext.jsx`.

## Environment Directory

Pick a project to see its **Development, QA and UAT** URLs with live status, plus a button that opens the project's **OneDrive** folder.

- Each row shows **Status** (Live / Down), **Response Time** and **Last Ping**. The header shows e.g. "3 environments • 2 live • 1 down".
- Status is checked from the viewer's browser when the tab opens, every 60 seconds while it stays open, and on **Check now**.
- **Team Leads and Project Managers** can add, edit and delete projects (set in `src/utils/roles.js`). Everyone else views and opens links.
- Links are validated: OneDrive must be a OneDrive/SharePoint link, and URLs containing a username or password are rejected.

### How accurate is the status?

The browser can tell that a server **responded** and how long it took, but browser security rules hide the HTTP status code. So:

- A server returning an error page still shows **Live**.
- Internal URLs show **Down** for anyone not on VPN, and for servers with self-signed certificates.
- On the published (https) site, `http://` URLs show **Can't check**, because browsers block them.
- "Last Ping" is the last time *this* browser checked. Nothing checks when nobody has the page open.

For production, run a monitor inside the company network that checks every URL every 1–5 minutes (e.g. **Uptime Kuma**, free and self-hosted, or **Azure Application Insights availability tests**), and have this page read its results. Only `src/lib/healthCheck.js` needs to change. A `/health` endpoint on each environment makes "Live" mean the app actually works.

The sample projects use public websites (example.com, mozilla.org) as stand-ins, plus one `.invalid` address that always shows Down.

## Admin Settings (TL and PM only)

The tab is hidden from QA Engineers, and they can't open it even if it was the last tab used.

- **User Management:** add and remove users and change roles. You can't change your own role or remove the last Team Lead/Project Manager, so nobody gets locked out.
- **Notifications:** turn template pop-ups, the bell's unread count and environment-down alerts on or off.
- **Security:** restrict OneDrive links to your company domain (e.g. `company-my.sharepoint.com`), set the maximum template upload size, and choose whether deletes need confirmation. Credentials in URLs are always blocked.
- **Template Update Settings:**
  - **Notification Recipients:** after a TL or PM uploads a template, the confirmation pop-up has an **Email the team** link that opens Outlook with these recipients, the subject and the change note filled in.
  - **Template Version Control:** on = keep version history and suggest the next version; off = a new upload replaces the current file.
  - **Auto-sync to OneDrive** *(simulated)*.
- **Integration Settings:** OneDrive status *(simulated)*.

Items marked **Simulated** need the hub connected to Microsoft 365 on a server (Microsoft Graph API). Everything else works in the demo.

## 1. Install tools (one time)

- **Node.js 20 LTS**: nodejs.org (check with `node -v`)
- **Git**: git-scm.com (check with `git --version`)
- **VS Code**: code.visualstudio.com

## 2. Run it

1. Unzip the download. Windows creates `cmmi-stat-engine\cmmi-stat-engine\`.
2. In VS Code: **File > Open Folder** and pick the **inner** `cmmi-stat-engine` folder (the one containing `package.json`).
3. Open the terminal (**View > Terminal**) and run:

```bash
npm install
npm run dev
```

4. Open the `Local:` address shown in the terminal (usually http://localhost:5173). Keep the terminal open while you use the app.

## 3. Exporting from Jira

In Jira, run a filter for your project's bugs (for example `project = ALPHA AND issuetype = Bug`),
then **Export > Export CSV (all fields)**. All fields matter because Sprint, Team and Story Points
are usually custom fields.

The engine looks for these columns automatically, and you can change them under **Column mapping**:

| Field | Typical Jira column | Used for |
|---|---|---|
| Sprint | `Sprint` | SPC, ANOVA, T-test |
| Team | `Custom field (Team)` or `Component/s` | ANOVA |
| Defect category | `Custom field (Root Cause)`, `Component/s`, `Labels` or `Priority` | Pareto |
| Issue type | `Issue Type` | "Bugs only" filter |
| Created / Resolved | `Created`, `Resolved` | Report period, resolution time |
| Story points | `Custom field (Story Points)` | T-test |
| Project | `Project name` | Report title |

If an issue moved between sprints, Jira repeats the Sprint column. The engine uses the latest sprint.

## 4. How each analysis works

- **Pareto**: counts defects per category, sorts them, and marks the "vital few" categories that together reach 80% of defects.
- **SPC (c-chart)**: centre line = average defects per sprint; control limits = mean ± 3 × √mean. A sprint is flagged if it falls outside the limits, or if 8+ sprints in a row sit on one side of the centre line.
- **ANOVA (one-way)**: for each team, takes the number of defects in each sprint, then tests whether the team averages differ. Degrees of freedom = (teams − 1, observations − teams).
- **Independent t-test (Student's, equal variances)**: compares the chosen metric per issue between Sprint A and Sprint B. Degrees of freedom = n₁ + n₂ − 2.
- Significance level α = 0.05. The statistics have been checked against Python's SciPy.

## 5. Publish on GitHub Pages

```bash
git init
git add .
git commit -m "CMMI Statistical Engine"
git branch -M main
git remote add origin https://github.com/<your-username>/cmmi-stat-engine.git
git push -u origin main
```

Then in GitHub: **Settings > Pages > Source: GitHub Actions**. The workflow in `.github/workflows/deploy.yml`
publishes to `https://<your-username>.github.io/cmmi-stat-engine/` on every push to `main`.

Note: if the repository is public, anyone with the link can open the app. Uploaded files still stay on each user's computer.

## Project structure

Admin Settings files:

```
src/
  lib/settingsStore.js                     All settings and their defaults
  lib/userStore.js                         Users and roles
  context/SettingsContext.jsx              Makes settings available everywhere
  components/admin/                        Toggle, user management, notification and security panels
  components/BrandLogo.jsx                 ESDS logo slot (public/brand/esds-logo.png)
  pages/AdminSettings.jsx                  Admin Settings tab
```

Environment Directory files:

```
src/
  lib/envStore.js                          Projects, URLs, validation (swap for a shared database)
  lib/healthCheck.js                       Browser status check (swap for a monitoring service)
  hooks/useHealthChecks.js                 Runs checks on open and every 60 seconds
  components/environments/                 Environment table and add/edit dialog
  pages/EnvironmentDirectory.jsx           Environment Directory tab
```

Template Repository files:

```
public/templates/                  Starter .docx and .xlsx templates
src/
  data/users.js                    Demo users and roles
  utils/roles.js                   Who can upload templates
  context/UserContext.jsx          "Viewing as" user
  context/TemplatesContext.jsx     Templates, notifications, unread state
  lib/templateStore.js             Template list, upload, download, versions (swap for a real backend)
  lib/fileDb.js                    Stores uploaded files in the browser
  lib/time.js                      "1 week ago" formatting
  components/AppHeader.jsx         Tabs, bell, user switcher
  components/NotificationBell.jsx  Bell with unread count
  components/Toast.jsx             Pop-up when a template is uploaded
  components/templates/            Template card and upload dialog
  pages/TemplateRepository.jsx     Template Repository tab
  pages/StatisticalEngine.jsx      Statistical Engine tab
```

Statistical Engine files:

```
public/sample-jira-bugs.csv      Sample Jira export (Project Alpha, 4 teams, 8 sprints)
src/
  lib/stats.js                   Pure maths: ANOVA, t-test, p-values, c-chart
  lib/parseFile.js               Reads CSV / XLSX / Jira HTML-XLS
  lib/columns.js                 Finds Jira columns, parses Jira dates
  lib/analysis.js                Turns Jira rows into Pareto / SPC / test results
  lib/theme.js                   Chart colours
  components/
    FileUpload.jsx               Upload box + sample data button
    DataSummary.jsx              Project, period, column mapping
    ParetoSection.jsx            Pareto chart + table
    SpcSection.jsx               Control chart
    HypothesisSection.jsx        ANOVA + T-test
    TestCard.jsx                 Card layout for one test result
  App.jsx                        Puts the page together
  styles.css                     All styling (colours at the top)
```
#   h a r s h a a a s . g i t h u b . i o  
 