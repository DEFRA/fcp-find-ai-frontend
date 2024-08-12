import { initAll } from 'govuk-frontend'
import './application.scss'
initAll()

document.addEventListener('DOMContentLoaded', (event) => {
  const sendButton = document.getElementById('sendButton')
  const sendForm = document.getElementById('sendForm')
  const loadingSpinner = document.getElementById('loadingSpinner')
  let searching = false

  const schemeAll = document.getElementById('schemeAll')
  const schemeCS = document.getElementById('schemeCS')
  const schemeFETF = document.getElementById('schemeFETF')
  const schemeSIG = document.getElementById('schemeSIG')
  const schemeSFI = document.getElementById('schemeSFI')

  const copyButton = document.getElementById('copyButton')
  const printButton = document.getElementById('printButton')

  if (sendButton) {
    sendButton.onclick = (event) => {
      event.preventDefault()

      if (!searching) {
        sendButton.disabled = true
        sendButton.style.display = 'none'

        if (loadingSpinner) {
          loadingSpinner.style.display = 'block'
        }

        searching = true
        trackConversationEvent && trackConversationEvent('user message sent')
        sendForm.submit()
      }
    }
  }

  if (copyButton) {
    copyButton.onclick = (event) => {
      event.preventDefault()

      const bodyContent = document.getElementById('bodyContent')

      if (bodyContent) {
        const text = bodyContent.innerText

        navigator.clipboard.writeText(text).then(
          () => {},
          () => {
            console.error('Failed to copy')
          }
        )
      }
      trackConversationEvent && trackConversationEvent('copy')
    }
  }

  if (printButton) {
    printButton.onclick = (event) => {
      event.preventDefault()
      trackConversationEvent && trackConversationEvent('print')

      window.print()
    }
  }

  // find form with the action including /reset string
  const resetForm = document.querySelector('form[action*="/reset"]')

  // if it exists, track the onsubmit event with the trackConversationEvent function
  if (resetForm) {
    resetForm.onsubmit = () => {
      trackConversationEvent && trackConversationEvent('new conversation')
    }
  }
})
