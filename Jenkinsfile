
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
    }
}