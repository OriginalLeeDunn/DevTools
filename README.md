# Project Developer Tools Suite

A comprehensive collection of web-based developer tools designed to streamline various tasks. This project provides a centralized dashboard with easy access to multiple utility tools for developers, testers, and other tech professionals.

## Overview

This project delivers standalone HTML/JS tools that can be run directly in a browser without additional dependencies. Each tool is built using HTML, JavaScript, and Tailwind CSS for styling, making them lightweight and easily deployable.

## Features

- **Unified Dashboard**: Central hub to access all tools
- **No Dependencies**: Run directly in any modern browser
- **Responsive Design**: Works on desktop and mobile devices
- **Local Storage**: Saves your preferences and recent activity
- **Dark Mode Support**: Easy on the eyes during those late-night coding sessions

## Available Tools

### Password Generator
Generate secure passwords with customizable options:
- Adjustable password length
- Character type selection (lowercase, uppercase, numbers, symbols)
- Special options for excluding similar characters
- Memorable password generation with word-based passphrases
- PIN code generation
- Password strength indicator

### Math Tool
A versatile calculator with both basic and scientific functions:
- Basic arithmetic operations
- Scientific calculations including trigonometric functions
- Memory functions
- Calculation history
- Common mathematical constants

### JSON Formatter
Format, validate, and transform JSON data:
- Pretty print with customizable indentation
- Minify JSON
- Validate JSON syntax
- Convert between JSON and YAML
- Tree view for easier navigation
- Syntax highlighting

### Base64 Tool
Encode and decode Base64 strings:
- Text encoding and decoding
- URL-safe Base64 support
- File to Base64 conversion
- Base64 to file download
- Image preview from Base64 strings

### Regex Tester
Test and debug regular expressions:
- Real-time matches highlighting
- Test against custom input
- Match information (position, groups)
- Common regex pattern library
- Regex explanation feature

### Unit Converter
Convert between different units of measurement:
- Length conversions (meters, feet, inches, etc.)
- Weight/mass conversions
- Volume conversions
- Temperature conversions
- Time, data size, and speed conversions
- Common conversion reference

### Code Snippet Manager
Save and organize code snippets:
- Syntax highlighting for multiple languages
- Search and tagging system
- Copy with a single click
- Categorize by language or purpose

### Currency Converter
Convert between different world currencies:
- Up-to-date exchange rates
- Support for major world currencies
- Quick conversion between any two currencies
- Historical rate reference

## Getting Started

1. Clone this repository:
```bash
git clone https://github.com/yourusername/projectLee.git
```

2. Open the dashboard:
```
/dashboard/index.html
```

3. Navigate to any tool you need from the dashboard

## Local Development

All tools are designed to run directly in a browser without a build step. Simply open the HTML files in your preferred browser.

To modify the styles, the project uses Tailwind CSS via CDN. You can customize the theme configuration in the `<script>` section of each HTML file.

## Project Structure

```
/projectLee
├── dashboard/
│   └── index.html          # Main dashboard
├── passwordGenerator/
│   └── password_generator.html
├── mathTool/
│   └── math_tool.html
├── jsonFormatter/
│   └── json_formatter.html
├── base64Tool/
│   └── base64_tool.html
├── regexTester/
│   └── regex_tester.html
├── unitConverter/
│   └── unit_converter.html
├── codeSnippetManager/
│   └── code_snippet_manager.html
├── currencyConverter/
│   └── currency_converter.html
└── README.md               # This file
```

## Browser Support

The tools are compatible with all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Prism.js](https://prismjs.com/) for syntax highlighting in some tools
- [js-yaml](https://github.com/nodeca/js-yaml) for YAML conversion in the JSON formatter
