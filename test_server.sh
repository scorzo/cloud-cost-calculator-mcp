#!/bin/bash
# Test MCP server

echo "Testing MCP Server..."
echo "================================="
echo ""

# Test 1: Check if server builds
echo "Test 1: Checking server build..."
if [ -f "mcp-server/dist/index.js" ]; then
    echo "✓ MCP server built successfully"
else
    echo "✗ Server build missing"
    exit 1
fi

# Test 2: Check if data file exists
echo ""
echo "Test 2: Checking pricing data..."
if [ -f "mcp-server/src/data/pricing.json" ]; then
    echo "✓ Pricing data file exists"
else
    echo "✗ Pricing data file missing"
    exit 1
fi

# Test 3: Test TypeScript modules
echo ""
echo "Test 3: Testing server modules..."
cd mcp-server
node -e "
import('./dist/data-loader.js').then(m => {
  const loader = new m.PricingDataLoader();
  const instances = loader.listSupportedInstances();
  console.log('✓ Data loader works: ' + instances.length + ' instance types loaded');
}).catch(err => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});
" || exit 1

cd ..

# Test 4: Check CLI client build
echo ""
echo "Test 4: Checking CLI client build..."
if [ -d "cli-client/dist" ]; then
    echo "✓ CLI client built successfully"
else
    echo "✗ CLI client build missing"
    exit 1
fi

echo ""
echo "================================="
echo "All tests passed! ✓"
echo ""
echo "To run the application:"
echo "  cd cli-client"
echo "  npm start"
echo ""
echo "To install from GitHub (future):"
echo "  npm install github:yourusername/mcp-demo#mcp-server"
echo ""

