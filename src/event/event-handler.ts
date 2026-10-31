

export class EventHandler<TEventArgs> {
    private handlers: ((args: TEventArgs) => void)[] = [];

    public subscribe(handler: (args: TEventArgs) => void): void {
        this.handlers.push(handler);
    }

    public unsubscribe(handler: (args: TEventArgs) => void): void {
        this.handlers = this.handlers.filter((h) => h !== handler);
    }

    public invoke(args: TEventArgs): void {
        this.handlers.forEach((handler) => handler(args));
    }
}