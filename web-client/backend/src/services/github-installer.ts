/**
 * GitHub MCP Package Installer
 * Installs MCP servers from GitHub npm packages
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { MCPConfig } from '../types/index.js';

export class GitHubInstaller {
  private installDir: string;

  constructor(installDir: string = '/tmp/mcp-installs') {
    this.installDir = installDir;
    
    // Ensure install directory exists
    if (!fs.existsSync(this.installDir)) {
      fs.mkdirSync(this.installDir, { recursive: true });
    }
  }

  /**
   * Install MCP server from GitHub
   */
  async install(config: MCPConfig): Promise<string> {
    const { owner, repo, branch, subdirectory } = config;
    
    // Create unique temp directory for this installation
    const installId = `${owner}-${repo}-${branch}`.replace(/[^a-zA-Z0-9-]/g, '_');
    const tempDir = path.join(this.installDir, installId);
    const cloneDir = path.join(tempDir, 'repo');
    
    // Clean up existing installation
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(tempDir, { recursive: true });
    
    try {
      // Clone the repository
      const githubUrl = `https://github.com/${owner}/${repo}.git`;
      console.log(`Cloning repository from ${githubUrl}...`);
      
      execSync(`git clone --depth 1 --branch ${branch} ${githubUrl} repo`, {
        cwd: tempDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      
      // Determine the package directory
      // Default subdirectory for cloud-cost-calculator-mcp is 'mcp-server'
      const packageDir = subdirectory 
        ? path.join(cloneDir, subdirectory)
        : this.findPackageDirectory(cloneDir);
      
      if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
        throw new Error(`No package.json found in ${packageDir}`);
      }
      
      console.log(`Installing dependencies in ${packageDir}...`);
      
      // Install dependencies
      execSync('npm install', {
        cwd: packageDir,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      
      // Build if there's a build script
      const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8'));
      if (pkg.scripts && pkg.scripts.build) {
        console.log('Building package...');
        execSync('npm run build', {
          cwd: packageDir,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      }
      
      // Find the server executable
      const serverPath = this.findServerExecutable(packageDir, repo, subdirectory);
      
      if (!serverPath) {
        throw new Error(`Could not locate MCP server executable in installed package`);
      }
      
      console.log(`✓ MCP server installed at: ${serverPath}`);
      return serverPath;
      
    } catch (error) {
      // Clean up on failure
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      if (error instanceof Error) {
        throw new Error(`Failed to install MCP from GitHub: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Find the package directory in the cloned repo
   */
  private findPackageDirectory(repoDir: string): string {
    // Common MCP package locations
    const possibleDirs = [
      'mcp-server',
      'server',
      'packages/server',
      'packages/mcp',
      '',  // Root directory
    ];
    
    for (const dir of possibleDirs) {
      const fullPath = path.join(repoDir, dir);
      if (fs.existsSync(path.join(fullPath, 'package.json'))) {
        return fullPath;
      }
    }
    
    // Default to root
    return repoDir;
  }

  /**
   * Find the MCP server executable in the package directory
   */
  private findServerExecutable(
    packageDir: string,
    repo: string,
    subdirectory?: string
  ): string | null {
    // Common paths to check (relative to package directory)
    const possiblePaths = [
      path.join(packageDir, 'dist', 'index.js'),
      path.join(packageDir, 'build', 'index.js'),
      path.join(packageDir, 'index.js'),
      path.join(packageDir, 'src', 'index.js'),
    ];
    
    // Check each possible path
    for (const serverPath of possiblePaths) {
      if (fs.existsSync(serverPath)) {
        return serverPath;
      }
    }
    
    // If not found, try to read package.json to find main/bin
    try {
      const packageJsonPath = path.join(packageDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        // Check bin field
        if (pkg.bin) {
          const binPath = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
          const fullBinPath = path.join(packageDir, binPath as string);
          if (fs.existsSync(fullBinPath)) {
            return fullBinPath;
          }
        }
        
        // Check main field
        if (pkg.main) {
          const mainPath = path.join(packageDir, pkg.main);
          if (fs.existsSync(mainPath)) {
            return mainPath;
          }
        }
      }
    } catch (error) {
      console.error('Error reading package.json:', error);
    }
    
    return null;
  }

  /**
   * Cleanup installation directory
   */
  cleanup(config: MCPConfig): void {
    const { owner, repo, branch } = config;
    const installId = `${owner}-${repo}-${branch}`.replace(/[^a-zA-Z0-9-]/g, '_');
    const tempDir = path.join(this.installDir, installId);
    
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`✓ Cleaned up installation: ${tempDir}`);
    }
  }
}

