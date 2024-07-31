export class InstanceDisposedError extends Error {
  constructor(name: string = "Instance") {
    super(`${name} has been disposed`);
  }
}
