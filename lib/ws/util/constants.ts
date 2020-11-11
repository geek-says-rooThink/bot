export enum EventType {
  IDENTIFY_CLIENT = 0,
  LAUNCH_CLIENT = 1,
  READY_CLIENT = 2,
  RECONNECT_CLIENT = 3,
  RESTART_CLIENT = 4,
  REPLACE_CLIENT = 5,
  SEND_STATS = 6,
  LOAD_MODULE = 7,
  BROADCAST_EVAL = 8,
  ADMIN_ACTION = 9,
  SETTINGS_SYNC = 10,
  SK1ER_SPECS = 11,
}

export enum WebsocketStates {
  CONNECTING = 0,
  CONNECTED = 1,
  CLOSING = 2,
  CLOSED = 3,
  RECONNECTING = 4,
  IDLE = 5,
}
