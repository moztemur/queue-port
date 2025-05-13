// queueActor.ts

type QueueItem = any;

interface EnqueueCommand {
  type: 'enqueue';
  items: QueueItem[];
  resolve: () => void;
}

interface DequeueCommand {
  type: 'dequeue';
  count: number;
  timeout: number;
  resolve: (items: QueueItem[]) => void;
}

type QueueCommand = EnqueueCommand | DequeueCommand;

interface Requester {
  count: number;
  resolve: (items: QueueItem[]) => void;
  timer?: NodeJS.Timeout;
  infinite: boolean;
}

type QueueSubscriber = (state: { queue: QueueItem[]; requesters: Requester[] }) => void;

function createQueueActor() {
  const queue: QueueItem[] = [];
  const requesters: Requester[] = [];
  const commands: QueueCommand[] = [];
  const subscribers: QueueSubscriber[] = [];

  let processing = false;

  const notify = () => {
    const snapshot = {
      queue: [...queue],
      requesters: requesters.map((r) => ({ count: r.count, infinite: r.infinite, resolve: r.resolve, timer: r.timer })),
    };
    subscribers.forEach((cb) => cb(snapshot));
  };

  const processCommands = async () => {
    if (processing) return;
    processing = true;

    while (commands.length) {
      const cmd = commands.shift()!;
      if (cmd.type === 'enqueue') {
        while (requesters.length && cmd.items.length) {
          const requester = requesters[0];
          if (cmd.items.length >= requester.count) {
            const chunk = cmd.items.splice(0, requester.count);
            requester.resolve(chunk);
            if (requester.timer) clearTimeout(requester.timer);
            requesters.shift();
          } else {
            break;
          }
        }
        queue.push(...cmd.items);
        cmd.resolve();
        notify();
      }

      if (cmd.type === 'dequeue') {
        if (queue.length >= cmd.count) {
          const chunk = queue.splice(0, cmd.count);
          cmd.resolve(chunk);
          notify();
        } else if (cmd.timeout === 0) {
          cmd.resolve([]);
        } else {
          const infinite = cmd.timeout < 0;
          const requester: Requester = {
            count: cmd.count,
            resolve: cmd.resolve,
            infinite,
          };

          if (!infinite && cmd.timeout > 0) {
            requester.timer = setTimeout(() => {
              const index = requesters.indexOf(requester);
              if (index !== -1) requesters.splice(index, 1);
              requester.resolve([]);
              notify();
            }, cmd.timeout);
          }

          requesters.push(requester);
          notify();
        }
      }
    }

    processing = false;
  };

  const send = (cmd: QueueCommand) => {
    commands.push(cmd);
    processCommands();
  };

  return {
    enqueue: (items: QueueItem[]) =>
      new Promise<void>((resolve) => send({ type: 'enqueue', items, resolve })),
    dequeue: (count: number, timeout: number) =>
      new Promise<QueueItem[]>((resolve) => send({ type: 'dequeue', count, timeout, resolve })),
    queueSize: () => queue.length, // ✅ new method
    subscribe: (cb: QueueSubscriber) => subscribers.push(cb),
    getState: () => {
      console.log('getState', queue, requesters);
      return {
      queue: [...queue],
      requesters: requesters.map((r) => ({ count: r.count, infinite: r.infinite })),
    }},
  };
}

const queueRegistry: Record<string, ReturnType<typeof createQueueActor>> = {};

export function getQueue(queueName: string) {
  if (!queueRegistry[queueName]) {
    queueRegistry[queueName] = createQueueActor();
  }
  return queueRegistry[queueName];
}

export function getAllQueueStates() {
  console.log('getAllQueueStates', queueRegistry);
  return Object.entries(queueRegistry).map(([name, actor]) => ({
    name,
    ...actor.getState(),
  }));
}
