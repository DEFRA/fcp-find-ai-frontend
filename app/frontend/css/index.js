import { initAll } from 'govuk-frontend'
import './application.scss'
initAll()

document.addEventListener('DOMContentLoaded', (event) => {
  const sendButton = document.getElementById('sendButton')
  const sendForm = document.getElementById('sendForm')

  if (sendButton) {
    sendButton.onclick = (event) => {
      event.preventDefault()
      sendButton.disabled = true

      sendForm.submit()
    }
  }

  const promptTextArea = document.getElementById('prompt-id')

  if (promptTextArea) {
    promptTextArea.addEventListener('keypress', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault()

        sendForm.submit()
      }
    })
  }
})
