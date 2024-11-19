
# Web Inventory Automation

## Overview

Web Inventory Automation is a Node.js tool designed to automate the scraping of web elements and monitoring of API calls for specified URLs. It generates JSON outputs and detailed analytics, including visualizations and PDF summaries, organized into unique directories for each target URL.

## Features

- **Web Element Scraping**: Extracts tag names, IDs, classes, and attributes from all elements on a webpage.
- **API Monitoring**: Captures XHR, fetch, and websocket requests with details like URL, method, headers, and more.
- **Dynamic Browser Options**: Allows running in headless or headful mode, configurable via environment variables or command-line arguments.
- **Retry Mechanism**: Automatically retries failed URL processing with configurable retry limits and delays.
- **Parallel Processing**: Handles large URL lists efficiently with configurable concurrency limits.
- **Analytics and Reports**: Generates JSON analytics, visual charts, and PDF summaries for the extracted data.
- **Environment Configuration**: Easily configurable with a `.env` file for default settings.
- **Detailed Logging**: Logs execution details with color-coded console messages and persistent file-based logs.
- **Error Handling**: Gracefully handles errors during scraping or monitoring.

## Installation

### Clone the Repository

```bash
git clone https://github.com/adriandez/web-inventory-automation.git
cd web-inventory-automation
```

### Install Dependencies

```bash
npm install
```

### Setup Environment Variables

Create a `.env` file in the root directory:

```env
URLS_FILE=./urls.txt
OUTPUT_DIR=./output
CONCURRENCY_LIMIT=3
HEADLESS=true
```

- `URLS_FILE`: Path to the file containing URLs (one URL per line).
- `OUTPUT_DIR`: Directory for saving output files.
- `CONCURRENCY_LIMIT`: Number of URLs to process concurrently.
- `HEADLESS`: Set to `true` for headless mode or `false` for headful mode.

## Usage

### Run with Environment Configuration

If `URLS_FILE`, `OUTPUT_DIR`, and `HEADLESS` are defined in `.env`:

```bash
node src/index.js
```

### Run with Command-Line Arguments

Override `.env` values by specifying arguments:

```bash
node src/index.js urlsFile=custom-urls.txt outputDir=./custom-output headless=false
```

### Input File

The `urls.txt` file must contain one URL per line:

```plaintext
https://www.example.com
https://another-example.com
```

### Outputs

#### Output Directory

Each URL's data is saved in a directory named after its hostname:

```bash
./output/www_example_com/elements.json
./output/www_example_com/apiCalls.json
./output/www_example_com/analytics.json
./output/www_example_com/summary.pdf
```

#### File Descriptions

- **`elements.json`**: Contains details of web elements such as tag names, IDs, classes, and attributes.
- **`apiCalls.json`**: Captures API calls with details like URL, method, and headers.
- **`analytics.json`**: Summarizes extracted data with metrics and insights.
- **`summary.pdf`**: A detailed PDF report with charts and highlights for each URL.

## Logging

Logs are saved in the `logs` directory. Each log file is named using a timestamp, e.g., `app-2024-11-19-08-30-00.log`.

### Log Levels

- **INFO**: General information about the process.
- **WARN**: Warnings encountered during execution.
- **ERROR**: Errors during scraping or monitoring.
- **DEBUG**: Detailed debug information.
- **START/END**: Marks the beginning and end of tasks.
- **SUCCESS**: Indicates successful operations.

## Example Workflow

### Input File

Create a `urls.txt` file with the following content:

```plaintext
https://www.imdb.com
https://en.wikipedia.org/wiki/Main_Page
```

### Run the Tool

```bash
node src/index.js
```

### Output

Results are saved in directories like:

```plaintext
./output/www_imdb_com/
./output/en_wikipedia_org/
```

### Analytics and Reports

Check the `analytics.json` and `summary.pdf` files for insights and visualizations.

### Logs

Detailed logs are saved in the `logs/` directory.

## Dependencies

- `axios`: For future enhancements like API testing.
- `canvas`: For generating visual charts.
- `dotenv`: For environment variable management.
- `fs-extra`: For advanced file system operations.
- `p-limit`: For managing concurrency.
- `pdfkit`: For creating PDF reports.
- `puppeteer`: For browser automation and web scraping.

## Contribution

1. Fork the repository.
2. Create a new branch (`feature/your-feature`).
3. Commit your changes.
4. Submit a pull request.

## License

This project is licensed under the ISC License.

## Roadmap

- **Enhanced Reports**: Include more analytics and detailed insights.
- **Accessibility Analysis**: Add features for analyzing accessibility metrics.
- **Unit Tests**: Add comprehensive test coverage for all modules.

## Author

Built with ❤️ by AEZG.
