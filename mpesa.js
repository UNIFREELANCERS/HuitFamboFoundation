document.addEventListener('DOMContentLoaded', () => {
  const mpesaForm = document.getElementById('mpesaForm');
  const statusBox = document.getElementById('mpesaStatus');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (!mpesaForm) {
    return;
  }

  const showStatus = (message, success = false) => {
    if (!statusBox) return;
    statusBox.style.display = 'block';
    statusBox.style.background = success ? 'rgba(68, 214, 44, 0.15)' : 'rgba(249, 211, 66, 0.15)';
    statusBox.style.color = success ? '#44d62c' : 'var(--hf-yellow)';
    statusBox.textContent = message;
  };

  mpesaForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(mpesaForm);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      amount: Number(formData.get('amount')),
    };

    showStatus('Sending Mpesa STK push request…');

    try {
      const response = await fetch('http://localhost:5000/mpesa/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Unable to process request');
      }

      const result = await response.json();
      showStatus(result.message || 'Mpesa prompt sent. Check your phone to complete the donation.', true);
      mpesaForm.reset();
    } catch (error) {
      showStatus(error.message || 'Something went wrong. Try again shortly.');
    }
  });
});

