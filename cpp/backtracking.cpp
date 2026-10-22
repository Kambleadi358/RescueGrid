#include <iostream>
#include <vector>
using namespace std; bool solve(int request,vector<bool>&used){if(request==3)return true;vector<vector<int>>compatible={{0},{2},{0,1}};for(int team:compatible[request])if(!used[team]){used[team]=true;if(solve(request+1,used))return true;used[team]=false;}return false;}int main(){vector<bool>used(3);cout<<(solve(0,used)?"Valid assignment":"No assignment");} // exponential worst case
