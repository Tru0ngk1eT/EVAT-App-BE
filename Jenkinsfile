
pipeline {
    agent any

    tools {
	nodejs 'node24'
    }

    environment {
	IMAGE_NAME = 'evat-app-be'
	IMAGE_TAG = "${env.BUILD_NUMBER}"
        MONGOMS_DOWNLOAD_DIR = 'D:/JenkinsData/mongodb-binaries'
    }

        stages {
        stage('Build') {
            steps {
                bat 'npm ci'
                bat 'npm run build'
                bat 'docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest .'
            }
        }

        stage('Test') {
            steps {
                bat 'node node_modules/mongodb-memory-server/postinstall.js'
                bat 'npm run test:ci'
            }
            post {
                always {
                    junit 'junit.xml'
                }
            }
        }

        stage('Code Quality') {
            environment {
                SONAR_TOKEN = credentials('sonar-token')
            }
            steps {
                bat 'if "%SONAR_TOKEN%"=="" (echo ERROR: SONAR_TOKEN is empty & exit /b 1) else (echo SONAR_TOKEN loaded)'
                bat 'npx sonar-scanner-npm "-Dsonar.host.url=http://localhost:9000"'
            }
        }

        stage('Security') {
            steps {
                // 1. Dependency scan: full report saved as an artefact (does not block)
                bat 'npm audit --omit=dev --json > npm-audit.json || exit /b 0'
                // 2. Dependency gate: fail on any CRITICAL vulnerability
                bat 'npm audit --omit=dev --audit-level=critical'
                // 3. Image scan: report HIGH + CRITICAL (does not block)
                bat 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v D:/JenkinsData/trivy-cache:/root/.cache/ aquasec/trivy image --no-progress --severity HIGH,CRITICAL --exit-code 0 %IMAGE_NAME%:%IMAGE_TAG%'
                // 4. Image gate: fail on fixable CRITICAL vulnerabilities
                bat 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v D:/JenkinsData/trivy-cache:/root/.cache/ aquasec/trivy image --no-progress --severity CRITICAL --ignore-unfixed --exit-code 1 %IMAGE_NAME%:%IMAGE_TAG%'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'npm-audit.json', allowEmptyArchive: true
                }
            }
        }	
    }
}