import * as queueServer from './queue/server';
import * as dashboardServer from './dashboard/server';

const start = async ({
  port = 8765,
  enableDashboardServer = false,
  dashboardServerPort = 8760,
} = {}): Promise<void> => {
  await queueServer.start(port);

  if (enableDashboardServer) {
    await dashboardServer.start(dashboardServerPort);
  }
}

export { start }
