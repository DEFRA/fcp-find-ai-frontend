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
})
