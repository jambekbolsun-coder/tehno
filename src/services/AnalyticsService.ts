import { repositories } from "@/repositories";
import { supabaseGateway } from "@/repositories/SupabaseGateway";
import type { AnalyticsEvent, AnalyticsEventType } from "@/types/domain";
import { createId } from "@/utils/id";
import { nowIso } from "@/utils/date";

export interface AnalyticsService {
  track(type: AnalyticsEventType, data?: AnalyticsEvent["data"], productId?: string): AnalyticsEvent;
  list(): AnalyticsEvent[];
}

class LocalAnalyticsService implements AnalyticsService {
  private sessionId = createId("session");

  track(type: AnalyticsEventType, data: AnalyticsEvent["data"] = {}, productId?: string): AnalyticsEvent {
    const now = nowIso();
    const event: AnalyticsEvent = {
      id: createId("event"),
      type,
      sessionId: this.sessionId,
      productId,
      data,
      createdAt: now,
      updatedAt: now,
    };
    supabaseGateway.trackPublicEvent({
      eventName: type,
      sessionId: this.sessionId,
      productId,
      metadata: data,
    });
    return event;
  }

  list() {
    return repositories.analytics.findAll();
  }
}

export const analyticsService: AnalyticsService = new LocalAnalyticsService();
