import { start } from './server';

start({
  port: 8765,
  enableDashboardServer: true,
  dashboardServerPort: 8760
}).then(() => {
  console.log('queue (and dashboard) server started')
})
