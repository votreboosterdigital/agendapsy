'use client'
import { useEffect } from 'react'
import 'vanilla-cookieconsent/dist/cookieconsent.css'

export function CookieConsent() {
  useEffect(() => {
    import('vanilla-cookieconsent').then(({ default: cc }) => {
      cc.run({
        categories: {
          necessary: { enabled: true, readOnly: true },
          analytics: {},
        },
        language: {
          default: 'es',
          translations: {
            es: {
              consentModal: {
                title: 'Usamos cookies',
                description:
                  'Utilizamos cookies para mejorar tu experiencia. <a href="/privacidad">Política de privacidad</a>',
                acceptAllBtn: 'Aceptar todas',
                acceptNecessaryBtn: 'Rechazar todas',
                showPreferencesBtn: 'Gestionar preferencias',
              },
              preferencesModal: {
                title: 'Preferencias de cookies',
                acceptAllBtn: 'Aceptar todas',
                acceptNecessaryBtn: 'Rechazar todas',
                savePreferencesBtn: 'Guardar preferencias',
                sections: [
                  {
                    title: 'Cookies necesarias',
                    description: 'Esenciales para el funcionamiento del sitio.',
                    linkedCategory: 'necessary',
                  },
                  {
                    title: 'Cookies analíticas',
                    description: 'Nos ayudan a mejorar el sitio.',
                    linkedCategory: 'analytics',
                  },
                ],
              },
            },
            fr: {
              consentModal: {
                title: 'Nous utilisons des cookies',
                description:
                  'Nous utilisons des cookies pour améliorer votre expérience. <a href="/confidentialite">Politique de confidentialité</a>',
                acceptAllBtn: 'Accepter tout',
                acceptNecessaryBtn: 'Refuser tout',
                showPreferencesBtn: 'Gérer les préférences',
              },
              preferencesModal: {
                title: 'Préférences des cookies',
                acceptAllBtn: 'Accepter tout',
                acceptNecessaryBtn: 'Refuser tout',
                savePreferencesBtn: 'Enregistrer',
                sections: [
                  {
                    title: 'Cookies nécessaires',
                    description: 'Essentiels au fonctionnement du site.',
                    linkedCategory: 'necessary',
                  },
                  {
                    title: 'Cookies analytiques',
                    description: "Nous aident à améliorer le site.",
                    linkedCategory: 'analytics',
                  },
                ],
              },
            },
          },
        },
      })
    })
  }, [])

  return null
}
