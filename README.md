# The Package

A multi-step subscription form for gamers, allowing users to select plans, add-ons, and currencies.

![img.png](img.png)

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: [Bulma](https://bulma.io/), Font Awesome
- **Build Tool**: [Vite](https://vitejs.dev/)
- **API**: [exchangeratesapi.io](https://exchangeratesapi.io/)

## Getting Started

### Installation

1. Clone the repository or download the source code.
2. Open your terminal in the project root directory.
3. Install the dependencies:

   ```bash
   npm install
   ```

### Running the Application

To start the development server:

```bash
npm run dev
```

The application will be available at the port specified by Vite in the terminal.

## Test Mode

You can enter "Test mode" of the site via the cogwheel in the top left
- Ability to test what would happen if the currency API failed (Test Error button)
- Ability to reset form with a button at the end (Reset button)
