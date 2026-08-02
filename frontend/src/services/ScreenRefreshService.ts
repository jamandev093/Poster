class ScreenRefreshService {
  private static lastRefresh: Record<string, number> = {};

  private static readonly DEFAULT_INTERVAL = 5 * 60 * 1000;

  static shouldRefresh(
    screen: string,
    interval = this.DEFAULT_INTERVAL
  ): boolean {
    const last = this.lastRefresh[screen] ?? 0;

    return Date.now() - last >= interval;
  }

  static markRefreshed(screen: string): void {
    this.lastRefresh[screen] = Date.now();
  }

  static reset(screen?: string): void {
    if (screen) {
      delete this.lastRefresh[screen];
      return;
    }

    this.lastRefresh = {};
  }
}

export default ScreenRefreshService;
