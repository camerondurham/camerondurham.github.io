const root = document.querySelector('[data-codecanvas-runner]');

  if (root) {
    const apiBaseUrl = 'https://runner.fly.dev';
    const languageSelect = root.querySelector('[data-language]');
    const sourceInput = root.querySelector('[data-source]');
    const sourceMeta = root.querySelector('[data-source-meta]');
    const runButton = root.querySelector('[data-run]');
    const resetButton = root.querySelector('[data-reset]');
    const output = root.querySelector('[data-output]');
    const statusDot = root.querySelector('[data-status-dot]');
    const statusLabel = root.querySelector('[data-status-label]');
    const outputTabs = Array.from(root.querySelectorAll('[data-output-tab]'));

    const state = {
      activeOutput: 'stdout',
      outputs: {
        stdout: '',
        stderr: '',
        error: '',
      },
      languages: [],
    };

    const examples = {
      bash: 'echo "hello from CodeCanvas"\nprintf "today: "\ndate -u +"%Y-%m-%dT%H:%M:%SZ"',
      sh: 'echo "hello from CodeCanvas"\nprintf "shell: "\necho "$0"',
      python: 'items = ["code", "canvas", "play"]\nfor index, item in enumerate(items, 1):\n    print(f"{index}: {item}")',
      python3: 'items = ["code", "canvas", "play"]\nfor index, item in enumerate(items, 1):\n    print(f"{index}: {item}")',
      javascript: 'const values = ["code", "canvas", "play"];\nvalues.forEach((value, index) => console.log(`${index + 1}: ${value}`));',
      js: 'const values = ["code", "canvas", "play"];\nvalues.forEach((value, index) => console.log(`${index + 1}: ${value}`));',
      node: 'const values = ["code", "canvas", "play"];\nvalues.forEach((value, index) => console.log(`${index + 1}: ${value}`));',
      nodejs: 'const values = ["code", "canvas", "play"];\nvalues.forEach((value, index) => console.log(`${index + 1}: ${value}`));',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("hello from CodeCanvas")\n}',
      rust: 'fn main() {\n    println!("hello from CodeCanvas");\n}',
      'c++': '#include <iostream>\n\nint main() {\n    std::cout << "hello from CodeCanvas" << std::endl;\n    return 0;\n}',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "hello from CodeCanvas" << std::endl;\n    return 0;\n}',
    };

    const normalizeLanguage = (language) => language.trim().toLowerCase();
    const setStatus = (kind, label) => {
      statusDot.dataset.status = kind;
      statusLabel.textContent = label;
    };

    const setOutput = (stream, value) => {
      state.outputs[stream] = value || '';
      if (state.activeOutput === stream) {
        output.textContent = state.outputs[stream];
      }
    };

    const renderActiveOutput = () => {
      outputTabs.forEach((tab) => {
        const isActive = tab.dataset.outputTab === state.activeOutput;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      output.dataset.activeOutput = state.activeOutput;
      output.textContent = state.outputs[state.activeOutput] || '';
    };

    const exampleFor = (language) => {
      const normalized = normalizeLanguage(language);
      return examples[normalized] || `print("hello from ${language}")`;
    };

    const applyExample = () => {
      const language = languageSelect.value || 'bash';
      sourceInput.value = exampleFor(language);
      sourceMeta.textContent = language;
    };

    const resetOutputs = () => {
      setOutput('stdout', '');
      setOutput('stderr', '');
      setOutput('error', '');
    };

    const loadLanguages = async () => {
      setStatus('loading', 'Loading languages');
      languageSelect.disabled = true;
      resetOutputs();

      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/languages`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `request failed: ${response.status}`);
        }

        state.languages = Array.isArray(data.languages) ? data.languages : [];
        languageSelect.replaceChildren(
          ...state.languages.map((language) => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            return option;
          }),
        );

        if (state.languages.length === 0) {
          const option = document.createElement('option');
          option.textContent = 'none';
          languageSelect.replaceChildren(option);
          setStatus('error', 'No languages');
          return;
        }

        const preferred = state.languages.includes('bash') ? 'bash' : state.languages[0];
        languageSelect.value = preferred;
        languageSelect.disabled = false;
        applyExample();
        setStatus('ready', 'Ready');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown request error';
        languageSelect.replaceChildren(new Option('unavailable', ''));
        setOutput('error', message);
        state.activeOutput = 'error';
        renderActiveOutput();
        setStatus('error', 'Backend unavailable');
      }
    };

    const runCode = async () => {
      runButton.disabled = true;
      languageSelect.disabled = true;
      resetOutputs();
      setStatus('loading', 'Running');

      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: languageSelect.value,
            source: sourceInput.value,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `request failed: ${response.status}`);
        }

        setOutput('stdout', data.stdout || '');
        setOutput('stderr', data.stderr || '');
        setOutput('error', data.error || '');
        state.activeOutput = data.error ? 'error' : data.stderr ? 'stderr' : 'stdout';
        setStatus(data.error ? 'error' : 'ready', data.error ? 'Runtime error' : 'Finished');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown request error';
        setOutput('error', message);
        state.activeOutput = 'error';
        setStatus('error', 'Request failed');
      } finally {
        renderActiveOutput();
        runButton.disabled = false;
        languageSelect.disabled = state.languages.length === 0;
      }
    };

    outputTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        state.activeOutput = tab.dataset.outputTab;
        renderActiveOutput();
      });
    });

    languageSelect.addEventListener('change', () => {
      resetOutputs();
      applyExample();
    });
    resetButton.addEventListener('click', () => {
      resetOutputs();
      applyExample();
      state.activeOutput = 'stdout';
      renderActiveOutput();
    });
    runButton.addEventListener('click', () => {
      void runCode();
    });
    renderActiveOutput();
    void loadLanguages();
  }
