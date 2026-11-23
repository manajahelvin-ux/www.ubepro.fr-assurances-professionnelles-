/* Parcours en étapes du formulaire : les noms de champs restent inchangés pour l'API. */
(() => {
  const form = document.querySelector('#wf-form-Assurance-Form');
  const firstStep = form?.querySelector('.assurance-wizard-step');
  const followupStep = form?.querySelector('.followup-wizard-step');
  if (!form || !firstStep || !followupStep) return;

  const panels = [...firstStep.querySelectorAll('[data-wizard-panel]')];
  const checked = (name) => Boolean(form.querySelector(`input[name="${name}"]:checked`));
  const collectiveSelected = () => checked('reponse_1_6');
  const directorSelected = () => checked('reponse_1_7');

  function showFirstPanel(id) {
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.wizardPanel !== String(id);
    });
    firstStep.querySelector(`[data-wizard-panel="${id}"] button`)?.focus({ preventScroll: true });
  }

  function showFollowupPanel(id) {
    followupStep.querySelectorAll('[data-followup-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.followupPanel !== id;
    });
    followupStep.querySelector(`[data-followup-panel="${id}"] button`)?.focus({ preventScroll: true });
  }

  function syncConditionalChoices() {
    const vehicle = form.querySelector('#reponse_1_3');
    const vehicleCount = form.querySelector('.wizard-vehicle-count');
    if (vehicle && vehicleCount) {
      vehicleCount.hidden = !vehicle.checked;
      vehicleCount.required = vehicle.checked;
      if (!vehicle.checked) vehicleCount.value = '';
    }

    const collectiveGroup = firstStep.querySelector('[data-coverage-for="collective"]');
    const directorGroup = firstStep.querySelector('[data-coverage-for="director"]');
    if (collectiveGroup) collectiveGroup.hidden = !collectiveSelected();
    if (directorGroup) directorGroup.hidden = !directorSelected();
    if (!collectiveSelected()) {
      collectiveGroup?.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
    }
    if (!directorSelected()) {
      directorGroup?.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      followupStep.querySelectorAll('[data-followup-panel="director"] input[type="checkbox"]').forEach((input) => { input.checked = false; });
    }
  }

  firstStep.addEventListener('change', (event) => {
    if (event.target.matches('input[type="checkbox"]')) syncConditionalChoices();
  });

  firstStep.addEventListener('click', (event) => {
    const back = event.target.closest('[data-wizard-back]');
    if (back) {
      event.preventDefault();
      showFirstPanel(back.dataset.wizardBack);
      return;
    }

    const next = event.target.closest('[data-wizard-next]');
    if (!next) return;
    if (next.dataset.wizardNext === '2') {
      event.preventDefault();
      showFirstPanel('2');
    } else if (next.dataset.wizardBranch === 'social' && (collectiveSelected() || directorSelected())) {
      event.preventDefault();
      event.stopPropagation();
      showFirstPanel('3');
    }
    // Sans protection sociale, le bouton Suivant du panneau 2 passe directement à l'étape 4.
  }, true);

  followupStep.addEventListener('click', (event) => {
    if (event.target.closest('[data-followup-back]')) {
      event.preventDefault();
      showFollowupPanel('effectif');
      return;
    }

    const next = event.target.closest('[data-followup-next]');
    if (next && directorSelected()) {
      // Respecte le champ obligatoire de l'étape 4 avant d'ouvrir l'étape 5.
      const companySize = followupStep.querySelector('select[required]');
      if (companySize && !companySize.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        companySize.reportValidity();
        return;
      }
      // La question « Vous êtes ? » est l'étape 5 et ne concerne que le dirigeant.
      event.preventDefault();
      event.stopPropagation();
      showFollowupPanel('director');
    }
    // Si le dirigeant n'a pas été choisi, data-form="next-btn" continue à l'étape suivante.
  }, true);

  syncConditionalChoices();
})();
