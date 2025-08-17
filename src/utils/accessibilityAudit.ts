export interface AccessibilityIssue {
  element: HTMLElement
  type: 'error' | 'warning' | 'info'
  rule: string
  message: string
  suggestion: string
  wcagLevel: 'A' | 'AA' | 'AAA'
}

export interface AccessibilityAuditResult {
  issues: AccessibilityIssue[]
  score: number
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = []

  audit(container: HTMLElement = document.body): AccessibilityAuditResult {
    this.issues = []

    // Run all audit checks
    this.checkImages(container)
    this.checkHeadings(container)
    this.checkLinks(container)
    this.checkButtons(container)
    this.checkForms(container)
    this.checkColorContrast(container)
    this.checkFocusManagement(container)
    this.checkAriaLabels(container)
    this.checkLandmarks(container)
    this.checkTouchTargets(container)

    return this.generateReport()
  }

  private addIssue(
    element: HTMLElement,
    type: AccessibilityIssue['type'],
    rule: string,
    message: string,
    suggestion: string,
    wcagLevel: AccessibilityIssue['wcagLevel'] = 'AA'
  ) {
    this.issues.push({
      element,
      type,
      rule,
      message,
      suggestion,
      wcagLevel
    })
  }

  private checkImages(container: HTMLElement) {
    const images = container.querySelectorAll('img')

    images.forEach(img => {
      // Check for alt text
      if (!img.hasAttribute('alt')) {
        this.addIssue(
          img,
          'error',
          'img-alt',
          'Image missing alt attribute',
          'Add an alt attribute that describes the image content or use alt="" for decorative images',
          'A'
        )
      }

      // Check for empty alt on non-decorative images
      if (img.alt === '' && !img.hasAttribute('role') && !img.closest('[role="presentation"]')) {
        this.addIssue(
          img,
          'warning',
          'img-alt-empty',
          'Image has empty alt text but may not be decorative',
          'Ensure this image is truly decorative or provide descriptive alt text',
          'A'
        )
      }
    })
  }

  private checkHeadings(container: HTMLElement) {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1))

      // Check heading hierarchy
      if (level > previousLevel + 1) {
        this.addIssue(
          heading,
          'warning',
          'heading-hierarchy',
          `Heading level ${level} follows heading level ${previousLevel}`,
          'Ensure heading levels are sequential (don\'t skip levels)',
          'AA'
        )
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        this.addIssue(
          heading,
          'error',
          'heading-empty',
          'Heading is empty',
          'Provide descriptive text for the heading',
          'A'
        )
      }

      previousLevel = level
    })
  }

  private checkLinks(container: HTMLElement) {
    const links = container.querySelectorAll('a')

    links.forEach(link => {
      // Check for href attribute
      if (!link.hasAttribute('href') && !link.hasAttribute('role')) {
        this.addIssue(
          link,
          'error',
          'link-href',
          'Link missing href attribute',
          'Add href attribute or use button element for interactive elements',
          'A'
        )
      }

      // Check for descriptive link text
      const linkText = link.textContent?.trim() || link.getAttribute('aria-label')
      if (!linkText || ['click here', 'read more', 'more', 'link'].includes(linkText.toLowerCase())) {
        this.addIssue(
          link,
          'warning',
          'link-text',
          'Link text is not descriptive',
          'Use descriptive link text that explains the link\'s purpose',
          'AA'
        )
      }

      // Check for target="_blank" without warning
      if (link.target === '_blank' && !link.getAttribute('aria-label')?.includes('opens in new')) {
        this.addIssue(
          link,
          'info',
          'link-new-window',
          'Link opens in new window without warning',
          'Add "opens in new window" to aria-label or visible text',
          'AAA'
        )
      }
    })
  }

  private checkButtons(container: HTMLElement) {
    const buttons = container.querySelectorAll('button, [role="button"]')

    buttons.forEach(button => {
      // Check for accessible name
      const accessibleName = button.textContent?.trim() ||
                           button.getAttribute('aria-label') ||
                           button.getAttribute('aria-labelledby')

      if (!accessibleName) {
        this.addIssue(
          button,
          'error',
          'button-name',
          'Button has no accessible name',
          'Add text content, aria-label, or aria-labelledby attribute',
          'A'
        )
      }

      // Check for disabled buttons without explanation
      if (button.hasAttribute('disabled') && !button.getAttribute('aria-describedby')) {
        this.addIssue(
          button,
          'info',
          'button-disabled',
          'Disabled button without explanation',
          'Consider adding aria-describedby to explain why the button is disabled',
          'AAA'
        )
      }
    })
  }

  private checkForms(container: HTMLElement) {
    const formControls = container.querySelectorAll('input, select, textarea')

    formControls.forEach(control => {
      // Check for labels
      const id = control.id
      const label = id ? container.querySelector(`label[for="${id}"]`) : null
      const ariaLabel = control.getAttribute('aria-label')
      const ariaLabelledby = control.getAttribute('aria-labelledby')

      if (!label && !ariaLabel && !ariaLabelledby) {
        this.addIssue(
          control,
          'error',
          'form-label',
          'Form control has no associated label',
          'Add a label element, aria-label, or aria-labelledby attribute',
          'A'
        )
      }

      // Check for required fields
      if (control.hasAttribute('required') && !control.getAttribute('aria-required')) {
        this.addIssue(
          control,
          'warning',
          'form-required',
          'Required field not marked with aria-required',
          'Add aria-required="true" to required form fields',
          'AA'
        )
      }
    })
  }

  private checkColorContrast(container: HTMLElement) {
    // This is a simplified check - in production, you'd want a more robust color contrast analyzer
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label')

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element)
      const fontSize = parseFloat(styles.fontSize)
      const fontWeight = styles.fontWeight

      // Check if text is large (18pt+ or 14pt+ bold)
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))

      // This is a placeholder - actual contrast checking would require color parsing
      if (styles.color === styles.backgroundColor) {
        this.addIssue(
          element,
          'error',
          'color-contrast',
          'Text and background colors are the same',
          'Ensure sufficient color contrast between text and background',
          'AA'
        )
      }
    })
  }

  private checkFocusManagement(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    focusableElements.forEach(element => {
      // Check for focus indicators
      const styles = window.getComputedStyle(element, ':focus')
      if (styles.outline === 'none' && !styles.boxShadow && !styles.border) {
        this.addIssue(
          element,
          'warning',
          'focus-indicator',
          'Element may not have visible focus indicator',
          'Ensure focusable elements have visible focus indicators',
          'AA'
        )
      }
    })
  }

  private checkAriaLabels(container: HTMLElement) {
    const elementsWithAria = container.querySelectorAll('[aria-labelledby], [aria-describedby]')

    elementsWithAria.forEach(element => {
      // Check aria-labelledby references
      const labelledby = element.getAttribute('aria-labelledby')
      if (labelledby) {
        const ids = labelledby.split(' ')
        ids.forEach(id => {
          if (!container.querySelector(`#${id}`)) {
            this.addIssue(
              element,
              'error',
              'aria-labelledby',
              `aria-labelledby references non-existent element with id "${id}"`,
              'Ensure all aria-labelledby references point to existing elements',
              'A'
            )
          }
        })
      }

      // Check aria-describedby references
      const describedby = element.getAttribute('aria-describedby')
      if (describedby) {
        const ids = describedby.split(' ')
        ids.forEach(id => {
          if (!container.querySelector(`#${id}`)) {
            this.addIssue(
              element,
              'error',
              'aria-describedby',
              `aria-describedby references non-existent element with id "${id}"`,
              'Ensure all aria-describedby references point to existing elements',
              'A'
            )
          }
        })
      }
    })
  }

  private checkLandmarks(container: HTMLElement) {
    // Check for main landmark
    const main = container.querySelector('main, [role="main"]')
    if (!main) {
      this.addIssue(
        container,
        'warning',
        'landmark-main',
        'Page missing main landmark',
        'Add a main element or role="main" to identify the main content area',
        'AA'
      )
    }

    // Check for navigation landmarks
    const navs = container.querySelectorAll('nav, [role="navigation"]')
    navs.forEach(nav => {
      if (!nav.getAttribute('aria-label') && !nav.getAttribute('aria-labelledby')) {
        this.addIssue(
          nav,
          'info',
          'landmark-nav-label',
          'Navigation landmark without accessible name',
          'Add aria-label to distinguish multiple navigation landmarks',
          'AAA'
        )
      }
    })
  }

  private checkTouchTargets(container: HTMLElement) {
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea, [role="button"]')

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect()
      const minSize = 44 // WCAG 2.1 AA minimum

      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue(
          element,
          'warning',
          'touch-target',
          `Touch target is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum 44x44px)`,
          'Ensure interactive elements are at least 44x44 pixels for touch accessibility',
          'AA'
        )
      }
    })
  }

  private generateReport(): AccessibilityAuditResult {
    const summary = {
      errors: this.issues.filter(issue => issue.type === 'error').length,
      warnings: this.issues.filter(issue => issue.type === 'warning').length,
      info: this.issues.filter(issue => issue.type === 'info').length
    }

    // Calculate score (0-100)
    const totalIssues = summary.errors + summary.warnings + summary.info
    const weightedScore = (summary.errors * 3) + (summary.warnings * 2) + (summary.info * 1)
    const maxPossibleScore = totalIssues * 3
    const score = maxPossibleScore > 0 ? Math.max(0, 100 - (weightedScore / maxPossibleScore * 100)) : 100

    return {
      issues: this.issues,
      score: Math.round(score),
      summary
    }
  }
}

export function runAccessibilityAudit(container?: HTMLElement): AccessibilityAuditResult {
  const auditor = new AccessibilityAuditor()
  return auditor.audit(container)
}

export function highlightAccessibilityIssues(issues: AccessibilityIssue[]) {
  // Remove existing highlights
  document.querySelectorAll('.accessibility-issue-highlight').forEach(el => {
    el.classList.remove('accessibility-issue-highlight')
  })

  // Add highlights for current issues
  issues.forEach(issue => {
    issue.element.classList.add('accessibility-issue-highlight')
    issue.element.setAttribute('data-accessibility-issue', issue.message)
  })
}

export function removeAccessibilityHighlights() {
  document.querySelectorAll('.accessibility-issue-highlight').forEach(el => {
    el.classList.remove('accessibility-issue-highlight')
    el.removeAttribute('data-accessibility-issue')
  })
}
