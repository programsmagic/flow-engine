// Flow Engine Documentation JavaScript

// Copy code functionality
function copyCode(elementId) {
  const codeElement = document.getElementById(elementId);
  const code = codeElement.textContent;
  
  navigator.clipboard.writeText(code).then(() => {
    // Show success feedback
    const button = codeElement.parentElement.querySelector('.copy-btn');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#10b981';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code: ', err);
  });
}

// Tab functionality
function showTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Show selected tab content
  const selectedContent = document.getElementById(tabName);
  if (selectedContent) {
    selectedContent.classList.add('active');
  }
  
  // Add active class to clicked button
  const clickedButton = event.target;
  clickedButton.classList.add('active');
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling to all anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Add syntax highlighting to code blocks
  highlightCodeBlocks();
  
  // Add scroll-to-top functionality
  addScrollToTop();
});

// Simple syntax highlighting for code blocks
function highlightCodeBlocks() {
  const codeBlocks = document.querySelectorAll('pre code');
  
  codeBlocks.forEach(block => {
    let code = block.textContent;
    
    // JavaScript/TypeScript highlighting
    if (code.includes('import') || code.includes('const') || code.includes('async')) {
      code = code
        .replace(/\b(import|export|from|const|let|var|function|async|await|return|if|else|for|while|class|interface|type)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
        .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
        .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
        .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
      
      block.innerHTML = code;
    }
  });
}

// Add scroll-to-top button
function addScrollToTop() {
  const scrollButton = document.createElement('button');
  scrollButton.innerHTML = '↑';
  scrollButton.className = 'scroll-to-top';
  scrollButton.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
  `;
  
  document.body.appendChild(scrollButton);
  
  // Show/hide scroll button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollButton.style.opacity = '1';
      scrollButton.style.visibility = 'visible';
    } else {
      scrollButton.style.opacity = '0';
      scrollButton.style.visibility = 'hidden';
    }
  });
  
  // Scroll to top when clicked
  scrollButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Add CSS for syntax highlighting
const style = document.createElement('style');
style.textContent = `
  .keyword { color: #c678dd; font-weight: bold; }
  .literal { color: #e06c75; }
  .string { color: #98c379; }
  .number { color: #d19a66; }
  .comment { color: #5c6370; font-style: italic; }
  
  .scroll-to-top:hover {
    background: var(--primary-dark);
    transform: translateY(-2px);
  }
`;
document.head.appendChild(style);

// Add analytics (replace with your analytics code)
function initAnalytics() {
  // Google Analytics or other analytics code can go here
  console.log('Analytics initialized');
}

// Initialize analytics when DOM is loaded
document.addEventListener('DOMContentLoaded', initAnalytics);