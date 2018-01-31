#include <iostream>
#include <algorithm>
#include <random>
using namespace std;

int main() {
    random_device rd; // obtain a random number from hardware
    mt19937 eng(rd()); // seed the generator
    uniform_int_distribution<> distr(-10, 20); // define the range
    int firstMatrix[4][3] = {0};
    int secondMatrix[4][3] = {0};

    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 3; j++) {
            firstMatrix[i][j] = distr(eng);
        }
    }

    cout << "First Matrix: " << endl;
    for (int i = 0; i < 4; i++) {
        cout << "[";
        for (int j = 0; j < 3; j++) {
            cout << firstMatrix[i][j] << ',';
        }
        cout << "]\n";
    }

    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 3; j++) {
            secondMatrix[i][j] = distr(eng);
        }
    }
    
    cout << "Second Matrix: " << endl;
    for (int i = 0; i < 4; i++) {
        cout << "[";
        for (int j = 0; j < 3; j++) {
            cout << secondMatrix[i][j] << ',';
        }
        cout << "]\n";
    }

    int matrix[4][3] = {0};

    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 3; j++) {
            matrix[i][j] = firstMatrix[i][j] + secondMatrix[i][j];
        }
    }

    cout << "Output matrix: " << endl;
    for (int i = 0; i < 4; i++) {
        cout << "[";
        for (int j = 0; j < 3; j++) {
            cout << matrix[i][j] << ',';
        }
        cout << "]\n";
    }

    return 0;
}