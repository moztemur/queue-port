# Queue-Port

Queue-Port is a library is a HTTP based server that can be used to manage queues based on Actor Model
You can enqueue items to the queue you named and dequeue how many items you want from the queue immediately, indefinitely or after a certain time.
Many clients can request to dequeue items from the queue at the same time. First come first served.
Queues are FIFO (First In First Out), which means that the first item added to the queue will be the first one to be removed.

# Installation

```bash
npm i -D queue-port
```

# Usage

```javascript
import * as queuePort from 'queue-port';

queuePort.start().then(() => {
  console.log('Queue-Port is running');
}).catch((err) => {
  console.error('Error starting Queue-Port:', err);
})
```

Default Port is 8765.

`start` function receives an object with the following properties:

- `port`: Port to run the server. Default is 8765.
- `enableDashboardServer`: Enable the dashboard server. Default is false.
- `dashboardServerPort`: Port to run the dashboard server. Default is 8760.

If you enable the dashboard server, you can access it at `http://localhost:8760`, and check the queues and waiters on a basic web interface.

One you run the server, you will be able to do the following operations via HTTP requests:

- Enqueue
- Dequeue
- Get Size

## Enqueue

Example Request:

```bash
curl --location 'http://localhost:8765/enqueue/myqueue' \
--header 'Content-Type: application/json' \
--data '{
    "items": ["item1", "item2", "item3"]
}'
```

Response:

```
Enqueued
```

## Dequeue

Example Request:


```bash
curl --location 'http://localhost:8765/dequeue/myqueue' \
--header 'Content-Type: application/json' \
--data '{
    "count": 2,
    "timeout": 0
}'
```

Response:

```json
{
    "items": ["item1", "item2"]
}
```

- `count`: Number of items to dequeue. Default is 1.
- `timeout`: Time to wait for items to be available in the queue. Default is -1 (indefinite). 
  - If set to -1 (or any negative number), it will wait INDEFINITELY for items to be available. 
  - If set to 0, it will return an empty array IMMEDIATELY if no items are available. If there are items available, it will return them immediately.
  - If set to a positive number, it will wait for that many milliseconds before returning an empty array if no items are available.

## Get Size

Example Request:

```bash
curl --location --request GET 'http://localhost:8765/size/myqueue'
```

Response:

```json
{
    "size": 1
}
```
