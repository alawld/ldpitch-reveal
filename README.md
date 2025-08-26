# LaunchDarkly Interactive Presentation

A dynamic reveal.js presentation that showcases LaunchDarkly's core value propositions with feature flag-controlled deep-dive sections.

## 🎯 Concept

This presentation demonstrates LaunchDarkly feature flags in a novel way - the presentation itself is controlled by LaunchDarkly feature flags! Start with a base deck showing overall value, then toggle flags live to reveal deep-dive sections on:

- **Guarded Releases** - Progressive rollouts and risk mitigation
- **Experimentation** - A/B testing and data-driven decisions  
- **AI Configs** - Dynamic AI model and prompt management
- **Observability** - Real-time monitoring and insights

## 🚀 Features

- **Dynamic Content**: Slides appear/disappear based on LaunchDarkly feature flags
- **Vertical Navigation**: Press ↓ to dive deeper into each topic
- **Real-time Control**: Toggle flags live during presentation
- **Clean UX**: No blank slides when flags are disabled
- **Containerized**: Runs in Docker for easy deployment

## 🛠️ Setup

### Prerequisites
- Docker and Docker Compose
- LaunchDarkly account with Client-Side ID

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd LDPitch-reveal
   ```

2. **Configure LaunchDarkly**
   - Create a `.env` file in the root directory
   - Add your LaunchDarkly Client-Side ID:
     ```
     LAUNCHDARKLY_CLIENT_SIDE_ID=your_client_side_id_here
     ```

3. **Set up Feature Flags**
   Create these boolean flags in your LaunchDarkly project:
   - `guarded-releases-section`
   - `experimentation-section`
   - `ai-configs-section`
   - `observability-section`

4. **Run the application**
   ```bash
   docker-compose up --build
   ```

5. **Open the presentation**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Navigation
- **Arrow Keys**: Navigate through slides
- **↓ Arrow**: Dive deeper into flag-controlled sections
- **Keyboard Shortcuts**:
  - `G` - Toggle Guarded Releases
  - `E` - Toggle Experimentation
  - `A` - Toggle AI Configs
  - `O` - Toggle Observability

### Flag Indicators
- Visual indicators in top-right show current flag states
- Click indicators to toggle flags
- Green = enabled, Gray = disabled

## 🏗️ Architecture

- **Frontend**: reveal.js presentation framework
- **Backend**: Node.js/Express server
- **Feature Flags**: LaunchDarkly Client-Side SDK
- **Containerization**: Docker with multi-stage build
- **Security**: Helmet.js with CSP headers

## 📁 Project Structure

```
LDPitch-reveal/
├── public/
│   ├── index.html          # Main presentation HTML
│   ├── css/
│   │   └── custom.css      # LaunchDarkly branding & styles
│   └── js/
│       └── app.js          # Main application logic
├── server.js               # Express server
├── package.json            # Dependencies
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Docker Compose setup
└── README.md              # This file
```

## 🎨 Customization

### Adding New Sections
1. Add HTML slides to `public/index.html` with `class="flag-slide" data-section="your-section"`
2. Create corresponding LaunchDarkly flag: `your-section-section`
3. Add keyboard shortcut in `public/js/app.js`

### Styling
- Modify `public/css/custom.css` for visual customization
- LaunchDarkly brand colors and fonts are already configured

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server (without Docker)
npm run dev

# Or use Docker for consistent environment
docker-compose up --build
```

### Debugging
- Browser console shows detailed logging
- Use `toggleAllFlags()` and `resetFlags()` in console for testing

## 📝 License

This project is for demonstration purposes. Please ensure you have appropriate licenses for reveal.js and other dependencies.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and adapt for your own LaunchDarkly presentations!