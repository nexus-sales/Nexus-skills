import type { StructuredProjectCategory } from '@/types/project-blueprint'

export interface DomainCatalogEntry {
  defaultScreens: string[]
  defaultEntities: string[]
  defaultRoles: string[]
  defaultSuggestedIntegrations: string[]
  defaultRisks: string[]
}

export const DOMAIN_CATALOG: Record<Exclude<StructuredProjectCategory, 'custom'>, DomainCatalogEntry> = {
  'booking-system': {
    defaultScreens: ['calendar', 'booking', 'confirmation'],
    defaultEntities: ['appointment', 'service', 'customer', 'professional', 'availability'],
    defaultRoles: ['customer', 'professional', 'admin'],
    defaultSuggestedIntegrations: ['google-calendar', 'email'],
    defaultRisks: ['calendar conflicts', 'missed appointments', 'unclear cancellation rules'],
  },
  'course-platform': {
    defaultScreens: ['course-catalog', 'course-detail', 'lesson', 'student-progress'],
    defaultEntities: ['course', 'module', 'lesson', 'student', 'instructor', 'progress'],
    defaultRoles: ['student', 'instructor', 'admin'],
    defaultSuggestedIntegrations: ['video-hosting', 'payment-gateway', 'email'],
    defaultRisks: ['unclear monetization', 'content maintenance', 'access control gaps'],
  },
  'landing-page': {
    defaultScreens: ['hero', 'benefits', 'lead-form', 'testimonials', 'cta'],
    defaultEntities: ['lead', 'service', 'testimonial', 'form', 'cta'],
    defaultRoles: ['visitor', 'sales-owner', 'admin'],
    defaultSuggestedIntegrations: ['analytics', 'crm', 'email'],
    defaultRisks: ['weak conversion message', 'lead follow-up not defined'],
  },
  marketplace: {
    defaultScreens: ['catalog', 'item-detail', 'contact-or-checkout', 'admin-products'],
    defaultEntities: ['product', 'category', 'image', 'price', 'discount', 'comment'],
    defaultRoles: ['visitor', 'customer', 'seller', 'admin'],
    defaultSuggestedIntegrations: ['email', 'payment-gateway'],
    defaultRisks: ['catalog vs checkout scope unclear', 'inventory rules not defined'],
  },
  crm: {
    defaultScreens: ['lead-list', 'lead-detail', 'pipeline', 'tasks'],
    defaultEntities: ['lead', 'account', 'opportunity', 'task', 'note'],
    defaultRoles: ['sales-user', 'sales-manager', 'admin'],
    defaultSuggestedIntegrations: ['email', 'calendar'],
    defaultRisks: ['pipeline stages unclear', 'follow-up ownership not defined'],
  },
  'support-system': {
    defaultScreens: ['ticket-list', 'ticket-detail', 'new-ticket', 'knowledge-base'],
    defaultEntities: ['ticket', 'customer', 'category', 'priority', 'response', 'agent'],
    defaultRoles: ['customer', 'support-agent', 'supervisor', 'admin'],
    defaultSuggestedIntegrations: ['email', 'knowledge-base'],
    defaultRisks: ['priority rules unclear', 'sla not defined'],
  },
  'content-system': {
    defaultScreens: ['content-list', 'content-detail', 'categories', 'editor'],
    defaultEntities: ['post', 'category', 'author', 'tag', 'media'],
    defaultRoles: ['reader', 'author', 'editor', 'admin'],
    defaultSuggestedIntegrations: ['analytics', 'newsletter'],
    defaultRisks: ['editorial workflow unclear', 'seo ownership not defined'],
  },
}
