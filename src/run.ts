import * as server from './server';
import * as dashboardServer from './dashboard/server';


const start = ({
  port = 8765,
  enableDashboardServer = false,
  dashboardServerPort = 8760,
}) => {
  server.start(port);

  if (enableDashboardServer) {
    dashboardServer.start(dashboardServerPort);
  }
}

export { start }
