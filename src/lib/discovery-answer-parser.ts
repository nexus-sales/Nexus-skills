import type { PendingQuestion, StructuredProjectBlueprint } from '@/types/project-blueprint'

export interface DiscoveryAnswer {
  questionKey: string
  rawQuestion: string
  answer: string
  confidence: number
}

export interface ResolvedQuestion {
  questionKey: string
  rawQuestion: string
  answer: string
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function toKey(question: string): string {
  const text = normalize(question)
  if (/compra online|solo catalogo|ecommerce|checkout|catalogo/.test(text)) return 'marketplace_checkout_scope'
  if (/panel de administracion|subir y editar/.test(text)) return 'marketplace-admin-panel'
  if (/comentarios|visitantes/.test(text)) return 'marketplace-comments-source'
  if (/descuentos|temporada|manual/.test(text)) return 'marketplace-discounts-mode'
  if (/instagram/.test(text)) return 'marketplace-instagram-mode'
  if (/whatsapp/.test(text)) return 'marketplace-whatsapp-mode'
  if (/stock|unidades|inventario/.test(text)) return 'marketplace-stock-mode'
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)
}

function splitSentences(input: string): string[] {
  return input
    .split(/\n|(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function hasCheckoutScopeAnswer(input: string): boolean {
  const text = normalize(input)
  return (
    /compra sera solo local/.test(text) ||
    /compra local/.test(text) ||
    /venta local/.test(text) ||
    /solo local/.test(text) ||
    /de momento local/.test(text) ||
    /preparad[ao] para (una )?segunda fase/.test(text) ||
    /checkout.*segunda fase/.test(text) ||
    /sin compra online/.test(text) ||
    /sin checkout/.test(text) ||
    /fase 2/.test(text) ||
    /segunda fase/.test(text)
  )
}

function findSentence(input: string, keywords: string[]): string | null {
  const sentences = splitSentences(input)
  return sentences.find((sentence) => keywords.every((keyword) => normalize(sentence).includes(normalize(keyword)))) ?? null
}

function findMarketplaceAnswer(input: string, question: PendingQuestion): DiscoveryAnswer | null {
  const questionKey = question.questionKey ?? toKey(question.question)
  const text = normalize(input)
  const rawQuestion = question.question

  if (
    questionKey === 'marketplace_checkout_scope' &&
    hasCheckoutScopeAnswer(input)
  ) {
    return {
      questionKey,
      rawQuestion,
      answer: 'venta local con checkout online pospuesto a fase 2',
      confidence: 0.96,
    }
  }

  if (questionKey === 'marketplace-admin-panel' && /panel.*admin|administracion|administrador/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['panel']) ?? 'Habra panel de administracion.',
      confidence: 0.9,
    }
  }

  if (questionKey === 'marketplace-comments-source' && /comentarios/.test(text) && /ambos|visitantes|creador/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['comentarios']) ?? 'Comentarios de creador y visitantes.',
      confidence: 0.88,
    }
  }

  if (questionKey === 'marketplace-discounts-mode' && /descuentos/.test(text) && /temporada|manual/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['descuentos']) ?? 'Descuentos estacionales y manuales.',
      confidence: 0.88,
    }
  }

  if (questionKey === 'marketplace-instagram-mode' && /instagram/.test(text) && /ambas|enlace|importacion|importar/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['instagram']) ?? 'Instagram como enlace e importacion.',
      confidence: 0.9,
    }
  }

  if (questionKey === 'marketplace-whatsapp-mode' && /whatsapp|whatssapp|wasap/.test(text) && /contacto|compra|soporte/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['whatsapp']) ?? 'WhatsApp como canal de contacto.',
      confidence: 0.9,
    }
  }

  if (questionKey === 'marketplace-stock-mode' && /stock|inventario|unidades/.test(text)) {
    return {
      questionKey,
      rawQuestion,
      answer: findSentence(input, ['stock']) ?? findSentence(input, ['inventario']) ?? 'Gestion de stock definida.',
      confidence: 0.86,
    }
  }

  return null
}

function findDirectAnswer(input: string, question: PendingQuestion): DiscoveryAnswer | null {
  const questionText = question.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = input.match(new RegExp(`${questionText}\\s*\\??\\s*([^\\n]+)`, 'i'))
  if (!match?.[1]) return null

  return {
    questionKey: question.questionKey ?? toKey(question.question),
    rawQuestion: question.question,
    answer: match[1].trim(),
    confidence: 0.82,
  }
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)))
}

function applyMarketplaceAnswer(blueprint: StructuredProjectBlueprint, answer: DiscoveryAnswer): StructuredProjectBlueprint {
  const confirmedRequirements = [...blueprint.confirmedRequirements]
  const integrations = [...blueprint.integrations]
  const monetization = [...blueprint.monetization]
  const constraints = [...blueprint.constraints]
  const suggestedIntegrations = [...blueprint.suggestedIntegrations]
  const risks = [...blueprint.risks]

  if (answer.questionKey === 'marketplace_checkout_scope') {
    monetization.push('venta-local')
    confirmedRequirements.push('catalogo-con-contacto-local')
    constraints.push('checkout-online-pospuesto-a-fase-2')
  }

  if (answer.questionKey === 'marketplace-admin-panel') confirmedRequirements.push('panel-de-administracion')
  if (answer.questionKey === 'marketplace-comments-source') confirmedRequirements.push('comentarios-de-creador-y-visitantes')
  if (answer.questionKey === 'marketplace-discounts-mode') confirmedRequirements.push('descuentos-estacionales-y-manuales')
  if (answer.questionKey === 'marketplace-instagram-mode') integrations.push('instagram-enlace-e-importacion')
  if (answer.questionKey === 'marketplace-whatsapp-mode') integrations.push('whatsapp-contacto')
  if (answer.questionKey === 'marketplace-stock-mode') confirmedRequirements.push('gestion-de-stock')

  return {
    ...blueprint,
    confirmedRequirements: unique(confirmedRequirements),
    integrations: unique(integrations),
    suggestedIntegrations: unique(
      answer.questionKey === 'marketplace_checkout_scope'
        ? suggestedIntegrations.filter((integration) => !['payment-gateway', 'pasarela-de-pago', 'pasarela de pago'].includes(normalize(integration)))
        : suggestedIntegrations
    ),
    monetization: unique(monetization),
    constraints: unique(constraints),
    risks: unique(
      answer.questionKey === 'marketplace_checkout_scope'
        ? risks.filter((risk) => {
            const normalizedRisk = normalize(risk)
            return (
              normalizedRisk !== 'catalog-vs-checkout-scope-unclear' &&
              normalizedRisk !== 'no-definir-si-es-catalogo-o-compra-online-puede-cambiar-arquitectura,-pagos-y-pedidos' &&
              normalizedRisk !== 'no definir si es catalogo o compra online puede cambiar arquitectura, pagos y pedidos' &&
              !/catalogo.*compra online.*arquitectura.*pagos.*pedidos/.test(normalizedRisk)
            )
          })
        : risks
    ),
  }
}

export function parseDiscoveryAnswers(input: string, pendingQuestions: PendingQuestion[]): DiscoveryAnswer[] {
  const checkoutQuestion = pendingQuestions.find((question) => (
    (question.questionKey ?? toKey(question.question)) === 'marketplace_checkout_scope' ||
    /compra online|solo catalogo|solo catálogo|checkout|catalogo|catálogo/.test(normalize(question.question))
  ))
  const semanticCheckoutAnswer = hasCheckoutScopeAnswer(input)
    ? [{
        questionKey: 'marketplace_checkout_scope',
        rawQuestion: checkoutQuestion?.question ?? 'La app tendra compra online o sera solo catalogo?',
        answer: 'venta local con checkout online pospuesto a fase 2',
        confidence: 0.95,
      }]
    : []

  const answers = [
    ...semanticCheckoutAnswer,
    ...pendingQuestions
    .map((question) => findDirectAnswer(input, question) ?? findMarketplaceAnswer(input, question))
    .filter((answer): answer is DiscoveryAnswer => Boolean(answer)),
  ]

  const seen = new Set<string>()
  return answers.filter((answer) => {
    if (seen.has(answer.questionKey)) return false
    seen.add(answer.questionKey)
    return true
  })
}

export function applyDiscoveryAnswersToBlueprint(
  blueprint: StructuredProjectBlueprint,
  answers: DiscoveryAnswer[]
): StructuredProjectBlueprint {
  const resolvedKeys = new Set(answers.map((answer) => answer.questionKey))
  const withResolvedAnswers = answers.reduce(
    (currentBlueprint, answer) => applyMarketplaceAnswer(currentBlueprint, answer),
    blueprint
  )

  return {
    ...withResolvedAnswers,
    pendingQuestions: withResolvedAnswers.pendingQuestions.filter((question) => {
      const questionKey = question.questionKey ?? toKey(question.question)
      const text = normalize(question.question)
      if (resolvedKeys.has(questionKey)) return false
      if (
        resolvedKeys.has('marketplace_checkout_scope') &&
        /compra online|solo catalogo|checkout|catalogo/.test(text)
      ) {
        return false
      }
      return true
    }),
    incorporatedDiscoveryAnswers: unique([
      ...(withResolvedAnswers.incorporatedDiscoveryAnswers ?? []),
      ...answers.map((answer) => `${answer.rawQuestion} -> ${answer.answer}`),
    ]),
  }
}

export function cleanIdeaFromDiscoveryAnswers(input: string, answers: DiscoveryAnswer[]): string {
  const answerSignals = answers.flatMap((answer) => {
    if (answer.questionKey === 'marketplace_checkout_scope') {
      return ['compra sera solo local', 'compra local', 'solo local', 'segunda fase', 'checkout segunda fase', 'sin compra online de momento']
    }
    return [answer.answer]
  })

  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      const text = normalize(line)
      if (!line) return false
      if (/^informacion (critica|recomendable|opcional)/.test(text)) return false
      if (/^(critica|recomendada|opcional)\s*\(\d+\)/.test(text)) return false
      if (/mejora la arquitectura|puede aplazarse|define arquitectura comercial/.test(text)) return false
      if (line.endsWith('?')) return false
      return !answerSignals.some((signal) => text === normalize(signal))
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}
