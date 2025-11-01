// Diagnostic utilities for debugging test failures

export function debugDOM(container, testName = "Unknown test") {
  console.log(`\n=== DEBUG: ${testName} ===`);
  console.log("Full DOM:", container.innerHTML);
  console.log("Visible text:", container.textContent);
  console.log(
    "All paragraphs:",
    Array.from(container.querySelectorAll("p")).map((p) => ({
      text: p.textContent,
      visible: p.offsetParent !== null,
      styles: window.getComputedStyle(p),
    }))
  );
  console.log("=== END DEBUG ===\n");
}

export function debugComponentState(
  componentInstance,
  testName = "Unknown test"
) {
  console.log(`\n=== STATE DEBUG: ${testName} ===`);
  if (componentInstance && componentInstance.state) {
    console.log("Component state:", componentInstance.state);
  } else {
    console.log("No component instance or state available");
  }
  console.log("=== END STATE DEBUG ===\n");
}

export function waitForMessage(expectedText, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const messageElements = Array.from(
        document.querySelectorAll("p, div, span")
      ).filter((el) => el.textContent.includes(expectedText));

      if (messageElements.length > 0) {
        resolve(messageElements[0]);
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for message: "${expectedText}"`));
        return;
      }

      setTimeout(check, 50);
    }

    check();
  });
}

export function logFetchCalls() {
  if (global.fetch && global.fetch.mock) {
    console.log("Fetch calls:", global.fetch.mock.calls);
  }
}
