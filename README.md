
# Web Inventory Automation

## Overview
Web Inventory Automation is a Node.js tool designed to scrape web elements and monitor API calls for a given set of URLs. The tool generates JSON outputs for web elements and API calls, organized into unique directories based on the target URLs.

## Features
- **Web Element Scraping**: Extracts tag names, IDs, classes, and attributes from all elements on a webpage.
- **API Monitoring**: Captures XHR, fetch, and websocket requests with details like URL, method, and headers.
- **Dynamic Input/Output**: Accepts URLs from a `.txt` file or command-line arguments. Outputs are stored in directories unique to each URL.
- **Environment Configuration**: Uses a `.env` file for default configurations.
- **Robust Logging**: Implements a detailed logger with color-coded console messages and file-based logs.
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
```
- `URLS_FILE`: Path to the file containing URLs (one URL per line).
- `OUTPUT_DIR`: Directory for saving output files.

## Usage

### Run with Environment Configuration
If `URLS_FILE` and `OUTPUT_DIR` are defined in `.env`:
```bash
node src/index.js
```

### Run with Command-Line Arguments
Override `.env` values by specifying arguments:
```bash
node src/index.js urlsFile=custom-urls.txt outputDir=./custom-output
```

### Input File
The `urls.txt` file must contain one URL per line:
```plaintext
https://www.example.com
https://another-example.com
```

## Outputs

### Output Directory
Outputs are stored in a directory named after the URL's hostname (e.g., `www_example_com`):
```bash
./output/www_example_com/elements.json
./output/www_example_com/apiCalls.json
```

### File Descriptions
- `elements.json`: Contains web elements with their tag names, IDs, classes, and attributes.
- `apiCalls.json`: Contains captured API calls with details like URL, method, and headers.

## Logging

Logs are stored in the `logs` directory. Each log file is named using a timestamp (e.g., `app-2024-11-18-08-30-00.log`).

### Log Levels
- **INFO**: General informational messages.
- **WARN**: Warnings during the process.
- **ERROR**: Errors encountered during execution.
- **DEBUG**: Detailed debug information.
- **START/END**: Mark the beginning and completion of key tasks.
- **SUCCESS**: Indicates successful operations.

## Example Workflow

### Input File
Create a `urls.txt` file with the following:
```plaintext
https://www.imdb.com
https://en.wikipedia.org/wiki/Main_Page
```

### Run the Tool
```bash
node src/index.js
```

### Output
Results are saved in `./output/www_imdb_com/` and `./output/en_wikipedia_org/`.

### Logs
Check logs in the `logs/` directory for detailed execution information.

## Dependencies
- `axios`: HTTP client for external API requests (future enhancements).
- `cheerio`: For parsing and manipulating HTML (potential integration).
- `dotenv`: For environment variable management.
- `fs-extra`: For enhanced file system operations.
- `puppeteer`: For web scraping and browser automation.

## Contribution
1. Fork the repository.
2. Create a new branch (`feature/your-feature`).
3. Commit your changes.
4. Submit a pull request.

## License
This project is licensed under the ISC License.

## Roadmap
- **Dynamic Browser Options**: Support for choosing headless/headful mode via configuration.
- **Enhanced Error Handling**: Retry mechanism for failed URL processing.
- **Parallel Processing**: Scraping multiple URLs concurrently.
- **Analytics**: Generate summary reports for extracted data.
- **Unit Tests**: Add tests for individual modules.

## Author
Built with ❤️ by AEZG.
