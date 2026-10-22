#include <iostream>
#include <vector>
using namespace std; int main(){vector<int>w={4,6,8},v={17,14,25};int W=12;vector<vector<int>>dp(4,vector<int>(W+1));for(int i=1;i<=3;i++)for(int c=0;c<=W;c++)dp[i][c]=w[i-1]>c?dp[i-1][c]:max(dp[i-1][c],v[i-1]+dp[i-1][c-w[i-1]]);cout<<dp[3][W];} // O(RW) time/space
