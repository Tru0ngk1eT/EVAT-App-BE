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

        stage('Deploy (Staging)') {
            environment {
                APP_PORT   = '3001'
                JWT_SECRET = credentials('jwt-secret')
            }
            steps {
                bat 'docker compose -p evat-staging up -d --wait'
                bat 'node scripts/smoke-test.js http://localhost:3001'
            }
        }

        stage('Release (Production)') {
            environment {
                IMAGE_TAG  = "v1.0.${env.BUILD_NUMBER}"
                APP_PORT   = '3002'
                JWT_SECRET = credentials('jwt-secret-prod')
                GITHUB     = credentials('github-pat')
            }
            steps {
                bat 'docker tag %IMAGE_NAME%:%BUILD_NUMBER% %IMAGE_NAME%:%IMAGE_TAG%'
                bat 'docker compose -p evat-prod up -d --wait'
                bat 'node scripts/smoke-test.js http://localhost:3002'
                bat 'docker tag %IMAGE_NAME%:%IMAGE_TAG% %IMAGE_NAME%:stable'
                bat 'git tag %IMAGE_TAG%'
                bat 'git push https://%GITHUB_USR%:%GITHUB_PSW%@github.com/Tru0ngk1eT/EVAT-App-BE.git %IMAGE_TAG%'
            }
            post {
                failure {
                    echo 'Release failed - rolling back production to the last stable image'
                    bat 'set IMAGE_TAG=stable&& docker compose -p evat-prod up -d --wait || exit /b 0'
                }
            }
        }

        stage('Monitoring') {
            steps {
                bat 'docker compose -f monitoring/docker-compose.yml -p evat-monitoring run --rm --entrypoint promtool prometheus check config /etc/prometheus/prometheus.yml'
                bat 'docker compose -f monitoring/docker-compose.yml -p evat-monitoring up -d'
                bat 'curl -s -X POST http://localhost:9090/-/reload || exit /b 0'
                bat 'node scripts/check-monitoring.js'
            }
        }	
    }
}