
pipeline {
    agent any

    tools {
	nodejs 'node24'
    }

    environment {
	IMAGE_NAME = 'evat-app-be'
	IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
	stage('Build') {
	    steps {
		bat 'npm ci'
		bat 'npm run build'
		bat 'docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest .'
	    }
	}
    }
}
